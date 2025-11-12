import os
import stripe
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from backend.database.sqlite_dal import User, Subscription, PaymentMethod, Transaction

# Initialize Stripe with API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

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


class StripeService:
    """Service class for handling Stripe payment operations"""
    
    @staticmethod
    def create_customer(email: str, firebase_uid: Optional[str] = None) -> str:
        """Create a Stripe customer"""
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
        return [
            {
                "id": plan_id,
                **plan_data
            }
            for plan_id, plan_data in SUBSCRIPTION_PLANS.items()
        ]
    
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
            if event.type == "payment_intent.succeeded":
                return StripeService._handle_payment_intent_succeeded(event.data.object, db)
            elif event.type == "payment_intent.payment_failed":
                return StripeService._handle_payment_intent_failed(event.data.object, db)
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
            
            return True  # Unhandled event type
        except Exception as e:
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
    def _handle_subscription_created(subscription: stripe.Subscription, db: Session) -> bool:
        """Handle subscription creation"""
        user = db.query(User).filter(User.stripe_customer_id == subscription.customer).first()
        if not user:
            return False
        
        # Create subscription record
        db_subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=subscription.id,
            plan_type=subscription.items.data[0].price.id if subscription.items.data else "unknown",
            status=subscription.status,
            current_period_start=datetime.fromtimestamp(subscription.current_period_start),
            current_period_end=datetime.fromtimestamp(subscription.current_period_end),
            cancel_at_period_end=subscription.cancel_at_period_end
        )
        
        db.add(db_subscription)
        db.commit()
        return True
    
    @staticmethod
    def _handle_subscription_updated(subscription: stripe.Subscription, db: Session) -> bool:
        """Handle subscription updates"""
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription.id
        ).first()
        
        if db_subscription:
            db_subscription.status = subscription.status
            db_subscription.current_period_start = datetime.fromtimestamp(subscription.current_period_start)
            db_subscription.current_period_end = datetime.fromtimestamp(subscription.current_period_end)
            db_subscription.cancel_at_period_end = subscription.cancel_at_period_end
            db_subscription.updated_at = datetime.now()
            db.commit()
        
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
    def _handle_invoice_payment_succeeded(invoice: stripe.Invoice, db: Session) -> bool:
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
        type: str = "card",
        card: Optional[Dict] = None,
        billing_details: Optional[Dict] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create a payment method"""
        try:
            payment_method_data = {
                "type": type,
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