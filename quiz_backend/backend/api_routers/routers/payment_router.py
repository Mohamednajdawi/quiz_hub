from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os

from backend.database.db import get_db
from backend.database.sqlite_dal import User, Subscription, PaymentMethod, Transaction
from backend.api_routers.schemas import (
    UserCreate, UserResponse, SubscriptionCreate, SubscriptionResponse,
    PaymentMethodCreate, PaymentMethodResponse, TransactionResponse,
    CreatePaymentIntentRequest, PaymentIntentResponse, SubscriptionPlan
)
from backend.services.stripe_service import StripeService
from backend.api_routers.routers.auth_router import get_current_user_dependency
import stripe

router = APIRouter(prefix="/payments", tags=["payments"])


# User Management
@router.post("/users", response_model=UserResponse)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user and Stripe customer"""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create Stripe customer
        stripe_customer_id = StripeService.create_customer(
            email=user_data.email,
            firebase_uid=user_data.firebase_uid
        )
        
        # Create user in database
        user = User(
            email=user_data.email,
            firebase_uid=user_data.firebase_uid,
            stripe_customer_id=stripe_customer_id
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("/users/email/{email}", response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):
    """Get user by email"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


# Subscription Plans
@router.get("/plans", response_model=List[SubscriptionPlan])
def get_available_plans():
    """Get available subscription plans"""
    try:
        plans = StripeService.get_available_plans()
        return [
            SubscriptionPlan(
                id=plan["id"],
                name=plan["name"],
                price=plan["price"],
                currency=plan["currency"],
                interval=plan["interval"],
                features=plan["features"],
                stripe_price_id=plan["stripe_price_id"]
            )
            for plan in plans
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Payment Intents
@router.post("/payment-intents", response_model=PaymentIntentResponse)
def create_payment_intent(
    payment_data: CreatePaymentIntentRequest,
    user_email: str,
    db: Session = Depends(get_db)
):
    """Create a payment intent for one-time payments"""
    try:
        # Get user
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create payment intent
        result = StripeService.create_payment_intent(
            amount=payment_data.amount,
            currency=payment_data.currency,
            customer_id=user.stripe_customer_id,
            description=payment_data.description,
            metadata=payment_data.metadata
        )
        
        return PaymentIntentResponse(
            client_secret=result["client_secret"],
            payment_intent_id=result["payment_intent_id"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Subscriptions
@router.post("/subscriptions", response_model=dict)
def create_subscription(
    subscription_data: SubscriptionCreate,
    user_email: str,
    db: Session = Depends(get_db)
):
    """Create a new subscription"""
    try:
        # Get user
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get plan details
        plans = StripeService.get_available_plans()
        plan = next((p for p in plans if p["id"] == subscription_data.plan_type), None)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan type"
            )
        
        # Create subscription
        result = StripeService.create_subscription(
            customer_id=user.stripe_customer_id,
            price_id=plan["stripe_price_id"],
            payment_method_id=subscription_data.payment_method_id,
            metadata={"user_id": user.id, "plan_type": subscription_data.plan_type}
        )
        
        return {
            "subscription_id": result["subscription_id"],
            "client_secret": result["client_secret"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(subscription_id: str, db: Session = Depends(get_db)):
    """Get subscription details"""
    try:
        # Get subscription from Stripe
        stripe_subscription = StripeService.get_subscription(subscription_id)
        
        # Get subscription from database
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if not db_subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
        
        return db_subscription
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/users/{user_id}/subscriptions", response_model=List[SubscriptionResponse])
def get_user_subscriptions(user_id: int, db: Session = Depends(get_db)):
    """Get all subscriptions for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    subscriptions = db.query(Subscription).filter(Subscription.user_id == user_id).all()
    return subscriptions


@router.post("/subscriptions/{subscription_id}/cancel")
def cancel_subscription(
    subscription_id: str,
    cancel_at_period_end: bool = True,
    db: Session = Depends(get_db)
):
    """Cancel a subscription"""
    try:
        result = StripeService.cancel_subscription(subscription_id, cancel_at_period_end)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Payment Methods
@router.post("/payment-methods", response_model=PaymentMethodResponse)
def create_payment_method(
    payment_method_data: PaymentMethodCreate,
    user_email: str,
    db: Session = Depends(get_db)
):
    """Create a payment method for a user"""
    try:
        # Get user
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Ensure user has a Stripe customer ID
        if not user.stripe_customer_id:
            customer_id = StripeService.create_customer(user.email, user.firebase_uid)
            user.stripe_customer_id = customer_id
            db.commit()
            db.refresh(user)
        
        # Attach payment method to customer in Stripe
        try:
            stripe.PaymentMethod.attach(
                payment_method_data.payment_method_id,
                customer=user.stripe_customer_id
            )
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to attach payment method to customer: {str(e)}"
            )
        
        # Set as default payment method if requested
        if payment_method_data.is_default:
            try:
                stripe.Customer.modify(
                    user.stripe_customer_id,
                    invoice_settings={
                        "default_payment_method": payment_method_data.payment_method_id
                    }
                )
            except stripe.error.StripeError as e:
                # Log the error but don't fail the request
                print(f"Failed to set default payment method: {str(e)}")
        
        # Create payment method in database
        payment_method = PaymentMethod(
            user_id=user.id,
            stripe_payment_method_id=payment_method_data.payment_method_id,
            type=payment_method_data.type,
            last4=payment_method_data.last4,
            brand=payment_method_data.brand,
            is_default=payment_method_data.is_default
        )
        
        db.add(payment_method)
        db.commit()
        db.refresh(payment_method)
        
        return payment_method
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/users/{user_id}/payment-methods", response_model=List[PaymentMethodResponse])
def get_user_payment_methods(user_id: int, db: Session = Depends(get_db)):
    """Get all payment methods for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    payment_methods = db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).all()
    return payment_methods


@router.delete("/payment-methods/{payment_method_id}")
def delete_payment_method(payment_method_id: str, db: Session = Depends(get_db)):
    """Delete a payment method"""
    try:
        # Delete from Stripe
        StripeService.delete_payment_method(payment_method_id)
        
        # Delete from database
        db_payment_method = db.query(PaymentMethod).filter(
            PaymentMethod.stripe_payment_method_id == payment_method_id
        ).first()
        
        if db_payment_method:
            db.delete(db_payment_method)
            db.commit()
        
        return {"message": "Payment method deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Transactions
@router.get("/users/{user_id}/transactions", response_model=List[TransactionResponse])
def get_user_transactions(user_id: int, db: Session = Depends(get_db)):
    """Get all transactions for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    return transactions


# Webhooks
@router.post("/webhooks")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events"""
    try:
        # Get the webhook secret
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        if not webhook_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Webhook secret not configured"
            )
        
        # Get the request body
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing stripe-signature header"
            )
        
        # Construct the event
        event = StripeService.construct_webhook_event(payload, sig_header, webhook_secret)
        
        # Handle the event
        success = StripeService.handle_webhook_event(event, db)
        
        if success:
            return {"status": "success"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to handle webhook event"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Checkout Sessions
class CreateCheckoutSessionRequest(BaseModel):
    plan_id: str  # "pro", "basic", "premium", "enterprise"
    success_url: str
    cancel_url: str


@router.post("/checkout-session")
def create_checkout_session(
    checkout_data: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_user_dependency),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout Session for subscription"""
    try:
        # Map plan IDs from config to Stripe plan IDs
        # Config uses: "pro", "starter", "teams"
        # Stripe uses: "basic", "premium", "enterprise"
        plan_mapping = {
            "pro": "premium",  # Map "pro" to "premium" plan
            "basic": "basic",
            "premium": "premium",
            "enterprise": "enterprise",
        }
        
        stripe_plan_id = plan_mapping.get(checkout_data.plan_id.lower())
        if not stripe_plan_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan ID: {checkout_data.plan_id}"
            )
        
        # Get plan details
        plans = StripeService.get_available_plans()
        plan = next((p for p in plans if p["id"] == stripe_plan_id), None)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan {stripe_plan_id} not configured. Please set STRIPE_{stripe_plan_id.upper()}_PRICE_ID environment variable."
            )
        
        if not plan.get("stripe_price_id"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Stripe price ID not configured for {stripe_plan_id} plan"
            )
        
        # Ensure user has a Stripe customer ID
        if not current_user.stripe_customer_id:
            try:
                stripe_customer_id = StripeService.create_customer(
                    email=current_user.email,
                    firebase_uid=current_user.firebase_uid
                )
                current_user.stripe_customer_id = stripe_customer_id
                db.commit()
                db.refresh(current_user)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create Stripe customer: {str(e)}"
                )
        
        # Create checkout session
        result = StripeService.create_checkout_session(
            customer_id=current_user.stripe_customer_id,
            price_id=plan["stripe_price_id"],
            success_url=checkout_data.success_url,
            cancel_url=checkout_data.cancel_url,
            metadata={
                "user_id": current_user.id,
                "plan_type": stripe_plan_id,
                "original_plan_id": checkout_data.plan_id
            }
        )
        
        return {
            "session_id": result["session_id"],
            "url": result["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


# Utility endpoints
@router.get("/health")
def payment_health_check():
    """Health check for payment service"""
    return {"status": "healthy", "service": "payments"} 