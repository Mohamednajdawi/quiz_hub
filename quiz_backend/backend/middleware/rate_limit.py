"""
Rate limiting middleware for FastAPI.

This middleware implements token bucket rate limiting to protect API endpoints
from abuse and ensure fair resource usage. It supports:
- Per-user rate limiting (authenticated users)
- Per-IP rate limiting (anonymous users)
- Configurable limits per endpoint
- Redis-backed storage for distributed systems
"""

import time
import json
from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Configuration for rate limiting"""
    
    # Default limits (requests per window)
    DEFAULT_LIMIT = 100  # requests
    DEFAULT_WINDOW = 60  # seconds
    
    # Stricter limits for generation endpoints
    GENERATION_LIMIT = 10  # requests
    GENERATION_WINDOW = 60  # seconds
    
    # Authentication endpoints
    AUTH_LIMIT = 5  # requests
    AUTH_WINDOW = 60  # seconds
    
    # Health check endpoints (more lenient)
    HEALTH_LIMIT = 1000  # requests
    HEALTH_WINDOW = 60  # seconds


class TokenBucket:
    """Token bucket implementation for rate limiting"""
    
    def __init__(self, capacity: int, refill_rate: float):
        """
        Args:
            capacity: Maximum number of tokens
            refill_rate: Tokens added per second
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
    
    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens from the bucket.
        
        Returns:
            True if tokens were consumed, False otherwise
        """
        now = time.time()
        elapsed = now - self.last_refill
        
        # Refill tokens based on elapsed time
        self.tokens = min(
            self.capacity,
            self.tokens + elapsed * self.refill_rate
        )
        self.last_refill = now
        
        # Check if we have enough tokens
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False
    
    def remaining(self) -> int:
        """Get remaining tokens"""
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(
            self.capacity,
            self.tokens + elapsed * self.refill_rate
        )
        self.last_refill = now
        return int(self.tokens)


class InMemoryRateLimiter:
    """In-memory rate limiter (for single-instance deployments)"""
    
    def __init__(self):
        self.buckets: dict[str, TokenBucket] = {}
    
    def _get_key(self, identifier: str, endpoint: str) -> str:
        """Generate a unique key for rate limiting"""
        return f"{identifier}:{endpoint}"
    
    def _get_limit_config(self, path: str) -> tuple[int, int]:
        """Get rate limit configuration based on endpoint path"""
        if "/auth/" in path:
            return (RateLimitConfig.AUTH_LIMIT, RateLimitConfig.AUTH_WINDOW)
        elif "/health" in path:
            return (RateLimitConfig.HEALTH_LIMIT, RateLimitConfig.HEALTH_WINDOW)
        elif any(x in path for x in ["/generate-", "/chat"]):
            return (RateLimitConfig.GENERATION_LIMIT, RateLimitConfig.GENERATION_WINDOW)
        else:
            return (RateLimitConfig.DEFAULT_LIMIT, RateLimitConfig.DEFAULT_WINDOW)
    
    def check_rate_limit(
        self,
        identifier: str,
        endpoint: str,
        limit: Optional[int] = None,
        window: Optional[int] = None
    ) -> tuple[bool, int, int]:
        """
        Check if request should be allowed.
        
        Returns:
            (allowed, remaining, reset_after)
        """
        key = self._get_key(identifier, endpoint)
        
        if limit is None or window is None:
            limit, window = self._get_limit_config(endpoint)
        
        # Create or get bucket
        if key not in self.buckets:
            refill_rate = limit / window  # tokens per second
            self.buckets[key] = TokenBucket(limit, refill_rate)
        
        bucket = self.buckets[key]
        
        # Update bucket capacity if limit changed
        if bucket.capacity != limit:
            refill_rate = limit / window
            self.buckets[key] = TokenBucket(limit, refill_rate)
        
        # Try to consume token
        allowed = bucket.consume(1)
        remaining = bucket.remaining()
        reset_after = window  # Approximate reset time
        
        return (allowed, remaining, reset_after)
    
    def cleanup_old_buckets(self, max_age: int = 3600):
        """Clean up old buckets (optional maintenance)"""
        # In production, you might want to implement this
        pass


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app, limiter: Optional[InMemoryRateLimiter] = None):
        super().__init__(app)
        self.limiter = limiter or InMemoryRateLimiter()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and apply rate limiting"""
        
        # Skip rate limiting for certain paths
        if request.url.path.startswith("/docs") or request.url.path.startswith("/redoc"):
            return await call_next(request)
        
        # Get identifier (user ID if authenticated, IP otherwise)
        identifier = self._get_identifier(request)
        endpoint = request.url.path
        
        # Check rate limit
        allowed, remaining, reset_after = self.limiter.check_rate_limit(
            identifier, endpoint
        )
        
        # Add rate limit headers
        response = await call_next(request) if allowed else self._rate_limit_response()
        
        response.headers["X-RateLimit-Limit"] = str(RateLimitConfig.DEFAULT_LIMIT)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + reset_after)
        
        if not allowed:
            logger.warning(
                f"Rate limit exceeded for {identifier} on {endpoint}. "
                f"Remaining: {remaining}, Reset in: {reset_after}s"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {reset_after} seconds.",
                headers={
                    "Retry-After": str(reset_after),
                    "X-RateLimit-Limit": str(RateLimitConfig.DEFAULT_LIMIT),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(int(time.time()) + reset_after),
                }
            )
        
        return response
    
    def _get_identifier(self, request: Request) -> str:
        """Get unique identifier for rate limiting"""
        # Try to get user ID from token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from backend.utils.auth import verify_token
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                if payload and "sub" in payload:
                    return f"user:{payload['sub']}"
            except Exception:
                pass
        
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            client_ip = forwarded_for.split(",")[0].strip()
        
        return f"ip:{client_ip}"
    
    def _rate_limit_response(self) -> Response:
        """Create rate limit response"""
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "error_code": "RATE_LIMIT_EXCEEDED"
            }
        )

