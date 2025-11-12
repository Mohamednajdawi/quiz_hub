import os
import stripe
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from backend.database.sqlite_dal import User, Subscription, Transaction

logger = logging.getLogger(__name__)

# Initialize Stripe with API key
stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
if not stripe_secret_key:
    logger.warning("STRIPE_SECRET_KEY is not set. Stripe functionality will not work.")
else:
    stripe.api_key = stripe_secret_key

# Available subscription plans
SUBSCRIPTION_PLANS = {
    "basic": {
        "name": "Basic Plan",
        "price": 999,  # $9.99
        "currency": "usd",
        "interval": "month",
        "features": [
            "Up to 50 quizzes per month",
            "Basic analytics",
            "Email support"
        ],
        "stripe_price_id": os.getenv("STRIPE_BASIC_PRICE_ID")
    },
    "premium": {
        "name": "Premium Plan",
        "price": 1999,  # $19.99
        "currency": "usd",
        "interval": "month",
        "features": [
            "Unlimited quizzes",
            "Advanced analytics",
            "Priority support",
            "Custom quiz templates",
            "Export functionality"
        ],
        "stripe_price_id": os.getenv("STRIPE_PREMIUM_PRICE_ID")
    },
    "enterprise": {
        "name": "Enterprise Plan",
        "price": 4999,  # $49.99
        "currency": "usd",
        "interval": "month",
        "features": [
            "Everything in Premium",
            "Team management",
            "API access",
            "Custom integrations",
            "Dedicated support"
        ],
        "stripe_price_id": os.getenv("STRIPE_ENTERPRISE_PRICE_ID")
    }
}


def validate_stripe_configuration() -> Dict[str, bool]:
    """Validate Stripe configuration and return status of required variables"""
    validation_status = {
        "stripe_secret_key": bool(stripe_secret_key),
        "stripe_webhook_secret": bool(os.getenv("STRIPE_WEBHOOK_SECRET")),
        "basic_price_id": bool(SUBSCRIPTION_PLANS["basic"]["stripe_price_id"]),
        "premium_price_id": bool(SUBSCRIPTION_PLANS["premium"]["stripe_price_id"]),
        "enterprise_price_id": bool(SUBSCRIPTION_PLANS["enterprise"]["stripe_price_id"]),
    }
    
    all_valid = all(validation_status.values())
    
    if not all_valid:
        missing = [key for key, value in validation_status.items() if not value]
        logger.warning("Stripe configuration incomplete. Missing: %s", ', '.join(missing))
    
    return validation_status


class StripeService:
    """Service class for handling Stripe payment operations"""
    
    @staticmethod
    def create_customer(email: str, firebase_uid: Optional[str] = None) -> str:
        """Create a Stripe customer"""
        if not stripe_secret_key:
            raise Exception("STRIPE_SECRET_KEY is not configured")
        try:
            customer_data = {
                "email": email,
                "metadata": {}
            }
            
            if firebase_uid:
                customer_data["metadata"]["firebase_uid"] = firebase_uid
            
            customer = stripe.Customer.create(**customer_data)
            return customer.id
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create Stripe customer: {str(e)}")
    
    @staticmethod
    def create_payment_intent(
        amount: int,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create a payment intent for one-time payments"""
        if not stripe_secret_key:
            raise Exception("STRIPE_SECRET_KEY is not configured")
        try:
            payment_intent_data = {
                "amount": amount,
                "currency": currency,
            }
            
            if customer_id:
                payment_intent_data["customer"] = customer_id
            
            if description:
                payment_intent_data["description"] = description
            
            if metadata:
                payment_intent_data["metadata"] = metadata
            
            payment_intent = stripe.PaymentIntent.create(**payment_intent_data)
            
            return {
                "client_secret": payment_intent.client_secret,
                "payment_intent_id": payment_intent.id
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create payment intent: {str(e)}")
    
    @staticmethod
    def create_subscription(
        customer_id: str,
        price_id: str,
        payment_method_id: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create a subscription"""
        if not stripe_secret_key:
            raise Exception("STRIPE_SECRET_KEY is not configured")
        if not price_id:
            raise Exception("Price ID is required to create a subscription")
        try:
            # Attach payment method to customer
            stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)
            
            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method_id}
            )
            
            # Create subscription
            subscription_data = {
                "customer": customer_id,
                "items": [{"price": price_id}],
                "payment_behavior": "default_incomplete",
                "payment_settings": {"save_default_payment_method": "on_subscription"},
                "expand": ["latest_invoice.payment_intent"]
            }
            
            if metadata:
                subscription_data["metadata"] = metadata
            
            subscription = stripe.Subscription.create(**subscription_data)
            
            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create subscription: {str(e)}")
    
    @staticmethod
    def cancel_subscription(subscription_id: str, cancel_at_period_end: bool = True) -> Dict:
        """Cancel a subscription"""
        try:
            if cancel_at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to cancel subscription: {str(e)}")
    
    @staticmethod
    def get_subscription(subscription_id: str) -> Dict:
        """Get subscription details"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
                "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "plan": subscription.items.data[0].price.id if subscription.items.data else None
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to get subscription: {str(e)}")
    
    @staticmethod
    def get_customer_payment_methods(customer_id: str) -> List[Dict]:
        """Get customer's payment methods"""
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card"
            )
            
            return [
                {
                    "id": pm.id,
                    "type": pm.type,
                    "card": {
                        "brand": pm.card.brand,
                        "last4": pm.card.last4,
                        "exp_month": pm.card.exp_month,
                        "exp_year": pm.card.exp_year
                    } if pm.card else None
                }
                for pm in payment_methods.data
            ]
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to get payment methods: {str(e)}")
    
    @staticmethod
    def delete_payment_method(payment_method_id: str) -> bool:
        """Delete a payment method"""
        try:
            stripe.PaymentMethod.detach(payment_method_id)
            return True
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to delete payment method: {str(e)}")
    
    @staticmethod
    def get_available_plans() -> List[Dict]:
        """Get available subscription plans"""
        plans = []
        for plan_id, plan_data in SUBSCRIPTION_PLANS.items():
            plan_dict = {
                "id": plan_id,
                **plan_data
            }
            # Filter out plans without price IDs (not configured)
            if plan_dict.get("stripe_price_id"):
                plans.append(plan_dict)
            else:
                logger.warning("Plan %s is missing stripe_price_id and will be excluded", plan_id)
        return plans
    
    @staticmethod
    def construct_webhook_event(payload: bytes, sig_header: str, webhook_secret: str) -> stripe.Event:
        """Construct webhook event from payload"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError as e:
            raise Exception(f"Invalid payload: {str(e)}")
        except stripe.error.SignatureVerificationError as e:
            raise Exception(f"Invalid signature: {str(e)}")
    
    @staticmethod
    def handle_webhook_event(event: stripe.Event, db: Session) -> bool:
        """Handle webhook events and update database accordingly"""
        try:
            logger.info(f"Processing webhook event: {event.type}")
            
            if event.type == "payment_intent.succeeded":
                return StripeService._handle_payment_intent_succeeded(event.data.object, db)
            elif event.type == "payment_intent.payment_failed":
                return StripeService._handle_payment_intent_failed(event.data.object, db)
            elif event.type == "checkout.session.completed":
                return StripeService._handle_checkout_session_completed(event.data.object, db)
            elif event.type == "customer.subscription.created":
                return StripeService._handle_subscription_created(event.data.object, db)
            elif event.type == "customer.subscription.updated":
                return StripeService._handle_subscription_updated(event.data.object, db)
            elif event.type == "customer.subscription.deleted":
                return StripeService._handle_subscription_deleted(event.data.object, db)
            elif event.type == "invoice.payment_succeeded":
                return StripeService._handle_invoice_payment_succeeded(event.data.object, db)
            elif event.type == "invoice.payment_failed":
                return StripeService._handle_invoice_payment_failed(event.data.object, db)
            else:
                logger.info(f"Unhandled webhook event type: {event.type}")
                return True  # Unhandled event type
        except Exception as e:
            logger.error(f"Failed to handle webhook event {event.type}: {str(e)}", exc_info=True)
            raise Exception(f"Failed to handle webhook event: {str(e)}")
    
    @staticmethod
    def _handle_payment_intent_succeeded(payment_intent: stripe.PaymentIntent, db: Session) -> bool:
        """Handle successful payment intent"""
        # Find user by customer ID
        user = db.query(User).filter(User.stripe_customer_id == payment_intent.customer).first()
        if not user:
            return False
        
        # Create or update transaction record
        transaction = Transaction(
            user_id=user.id,
            stripe_payment_intent_id=payment_intent.id,
            amount=payment_intent.amount / 100,  # Convert from cents
            currency=payment_intent.currency,
            status=payment_intent.status,
            description=payment_intent.description,
            transaction_metadata=payment_intent.metadata
        )
        
        db.add(transaction)
        db.commit()
        return True
    
    @staticmethod
    def _handle_payment_intent_failed(payment_intent: stripe.PaymentIntent, db: Session) -> bool:
        """Handle failed payment intent"""
        user = db.query(User).filter(User.stripe_customer_id == payment_intent.customer).first()
        if not user:
            return False
        
        # Update transaction status
        transaction = db.query(Transaction).filter(
            Transaction.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if transaction:
            transaction.status = payment_intent.status
            db.commit()
        
        return True
    
    @staticmethod
    def _handle_checkout_session_completed(session: stripe.checkout.Session, db: Session) -> bool:
        """Handle checkout session completion - this is triggered when using Stripe Checkout"""
        try:
            logger.info(f"Processing checkout.session.completed for session: {session.id}")
            
            # Only handle subscription mode checkout sessions
            if session.mode != "subscription":
                logger.info(f"Skipping non-subscription checkout session: {session.mode}")
                return True
            
            # Get customer ID from session
            customer_id = session.customer
            if not customer_id:
                logger.warning("Checkout session completed but no customer ID found")
                return False
            
            # Find user by customer ID
            user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if not user:
                logger.warning(f"User not found for customer ID: {customer_id}")
                return False
            
            logger.info(f"Found user {user.id} for customer {customer_id}")
            
            # Get subscription ID from session
            subscription_id = session.subscription
            if not subscription_id:
                logger.warning("Checkout session completed but no subscription ID found")
                return False
            
            logger.info(f"Retrieving subscription {subscription_id} from Stripe")
            
            # Retrieve subscription from Stripe to get full details
            try:
                subscription = stripe.Subscription.retrieve(subscription_id, expand=['items.data.price'])
            except stripe.error.StripeError as e:
                logger.error(f"Failed to retrieve subscription from Stripe: {str(e)}")
                return False
            
            # Get plan type from metadata or price ID
            plan_type = "unknown"
            if session.metadata and "plan_type" in session.metadata:
                plan_type = session.metadata["plan_type"]
                logger.info(f"Using plan_type from metadata: {plan_type}")
            elif subscription.items and subscription.items.data and len(subscription.items.data) > 0:
                # Map price ID to plan type
                price_id = subscription.items.data[0].price.id
                logger.info(f"Mapping price ID {price_id} to plan type")
                for plan_id, plan_data in SUBSCRIPTION_PLANS.items():
                    if plan_data.get("stripe_price_id") == price_id:
                        plan_type = plan_id
                        logger.info(f"Mapped to plan type: {plan_type}")
                        break
            
            # Safely get timestamp values
            try:
                current_period_start = datetime.fromtimestamp(subscription.current_period_start) if subscription.current_period_start else datetime.now()
                current_period_end = datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else datetime.now()
            except (TypeError, AttributeError) as e:
                logger.error(f"Error converting timestamps: {str(e)}, subscription: {subscription}")
                # Fallback to current time
                current_period_start = datetime.now()
                current_period_end = datetime.now()
            
            # Check if subscription already exists
            existing_subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == subscription_id
            ).first()
            
            if existing_subscription:
                # Update existing subscription
                logger.info(f"Updating existing subscription {subscription_id}")
                existing_subscription.status = subscription.status
                existing_subscription.plan_type = plan_type
                existing_subscription.current_period_start = current_period_start
                existing_subscription.current_period_end = current_period_end
                existing_subscription.cancel_at_period_end = getattr(subscription, 'cancel_at_period_end', False)
                existing_subscription.updated_at = datetime.now()
                db.commit()
                logger.info(f"Updated subscription {subscription_id} for user {user.id} - status: {subscription.status}, plan: {plan_type}")
            else:
                # Create new subscription record
                logger.info(f"Creating new subscription {subscription_id}")
                db_subscription = Subscription(
                    user_id=user.id,
                    stripe_subscription_id=subscription_id,
                    plan_type=plan_type,
                    status=subscription.status,
                    current_period_start=current_period_start,
                    current_period_end=current_period_end,
                    cancel_at_period_end=getattr(subscription, 'cancel_at_period_end', False)
                )
                db.add(db_subscription)
                db.commit()
                logger.info(f"Created subscription {subscription_id} for user {user.id} with plan {plan_type} - status: {subscription.status}")
            
            return True
        except Exception as e:
            logger.error(f"Error handling checkout session completed: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def _handle_subscription_created(subscription: stripe.Subscription, db: Session) -> bool:
        """Handle subscription creation"""
        logger.info(f"Processing customer.subscription.created for subscription: {subscription.id}")
        
        user = db.query(User).filter(User.stripe_customer_id == subscription.customer).first()
        if not user:
            logger.warning(f"User not found for customer ID: {subscription.customer}")
            return False
        
        # Get plan type from price ID
        plan_type = "unknown"
        if subscription.items and subscription.items.data and len(subscription.items.data) > 0:
            price_id = subscription.items.data[0].price.id
            # Map price ID to plan type
            for plan_id, plan_data in SUBSCRIPTION_PLANS.items():
                if plan_data.get("stripe_price_id") == price_id:
                    plan_type = plan_id
                    break
        
        # Safely get timestamp values
        try:
            current_period_start = datetime.fromtimestamp(subscription.current_period_start) if subscription.current_period_start else datetime.now()
            current_period_end = datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else datetime.now()
        except (TypeError, AttributeError) as e:
            logger.error(f"Error converting timestamps: {str(e)}")
            current_period_start = datetime.now()
            current_period_end = datetime.now()
        
        # Check if subscription already exists
        existing_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if existing_subscription:
            # Update existing subscription
            existing_subscription.status = subscription.status
            existing_subscription.plan_type = plan_type
            existing_subscription.current_period_start = current_period_start
            existing_subscription.current_period_end = current_period_end
            existing_subscription.cancel_at_period_end = getattr(subscription, 'cancel_at_period_end', False)
            existing_subscription.updated_at = datetime.now()
            db.commit()
            logger.info(f"Updated existing subscription {subscription.id} for user {user.id} - status: {subscription.status}, plan: {plan_type}")
        else:
            # Create subscription record
            db_subscription = Subscription(
                user_id=user.id,
                stripe_subscription_id=subscription.id,
                plan_type=plan_type,
                status=subscription.status,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
                cancel_at_period_end=getattr(subscription, 'cancel_at_period_end', False)
            )
            db.add(db_subscription)
            db.commit()
            logger.info(f"Created subscription {subscription.id} for user {user.id} with plan {plan_type} - status: {subscription.status}")
        
        return True
    
    @staticmethod
    def _handle_subscription_updated(subscription: stripe.Subscription, db: Session) -> bool:
        """Handle subscription updates"""
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if db_subscription:
            # Safely get timestamp values
            try:
                current_period_start = datetime.fromtimestamp(subscription.current_period_start) if subscription.current_period_start else db_subscription.current_period_start
                current_period_end = datetime.fromtimestamp(subscription.current_period_end) if subscription.current_period_end else db_subscription.current_period_end
            except (TypeError, AttributeError) as e:
                logger.error(f"Error converting timestamps in subscription update: {str(e)}")
                current_period_start = db_subscription.current_period_start
                current_period_end = db_subscription.current_period_end
            
            db_subscription.status = subscription.status
            db_subscription.current_period_start = current_period_start
            db_subscription.current_period_end = current_period_end
            db_subscription.cancel_at_period_end = getattr(subscription, 'cancel_at_period_end', False)
            db_subscription.updated_at = datetime.now()
            db.commit()
            logger.info(f"Updated subscription {subscription.id} - status: {subscription.status}")
        
        return True
    
    @staticmethod
    def _handle_subscription_deleted(subscription: stripe.Subscription, db: Session) -> bool:
        """Handle subscription deletion"""
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if db_subscription:
            db_subscription.status = "canceled"
            db_subscription.updated_at = datetime.now()
            db.commit()
        
        return True
    
    @staticmethod
    def _handle_invoice_payment_succeeded(_invoice: stripe.Invoice, _db: Session) -> bool:
        """Handle successful invoice payment"""
        # This is typically handled by payment_intent.succeeded
        return True
    
    @staticmethod
    def _handle_invoice_payment_failed(invoice: stripe.Invoice, db: Session) -> bool:
        """Handle failed invoice payment"""
        # Update subscription status if needed
        if invoice.subscription:
            db_subscription = db.query(Subscription).filter(
                Subscription.stripe_subscription_id == invoice.subscription
            ).first()
            
            if db_subscription:
                db_subscription.status = "past_due"
                db_subscription.updated_at = datetime.now()
                db.commit()
        
        return True 

    @staticmethod
    def create_payment_method(
        payment_type: str = "card",
        card: Optional[Dict] = None,
        billing_details: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create a payment method"""
        try:
            payment_method_data = {
                "type": payment_type,
            }
            
            if card:
                payment_method_data["card"] = card
            
            if billing_details:
                payment_method_data["billing_details"] = billing_details
            
            if metadata:
                payment_method_data["metadata"] = metadata
            
            payment_method = stripe.PaymentMethod.create(**payment_method_data)
            
            return {
                "id": payment_method.id,
                "type": payment_method.type,
                "card": {
                    "brand": payment_method.card.brand,
                    "last4": payment_method.card.last4,
                    "exp_month": payment_method.card.exp_month,
                    "exp_year": payment_method.card.exp_year
                } if payment_method.card else None,
                "billing_details": payment_method.billing_details
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create payment method: {str(e)}")
    
    @staticmethod
    def create_checkout_session(
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create a Stripe Checkout Session for subscription"""
        if not stripe_secret_key:
            raise Exception("STRIPE_SECRET_KEY is not configured")
        if not price_id:
            raise Exception("Price ID is required to create a checkout session")
        try:
            session_data = {
                "customer": customer_id,
                "payment_method_types": ["card"],
                "line_items": [
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                "mode": "subscription",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "allow_promotion_codes": True,
            }
            
            if metadata:
                session_data["metadata"] = metadata
            
            session = stripe.checkout.Session.create(**session_data)
            
            return {
                "session_id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to create checkout session: {str(e)}") 