"""
Script to check subscription data in the database
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from backend.database.db import SessionLocal, engine
from backend.database.sqlite_dal import Subscription, User, Base


def check_subscriptions():
    """Check all subscriptions in the database"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Get all subscriptions
        all_subscriptions = db.query(Subscription).all()
        
        print(f"Total subscriptions in database: {len(all_subscriptions)}\n")
        
        if not all_subscriptions:
            print("No subscriptions found in database.")
            return
        
        # Group by plan_type
        plan_type_counts = {}
        for sub in all_subscriptions:
            plan_type = sub.plan_type
            plan_type_counts[plan_type] = plan_type_counts.get(plan_type, 0) + 1
        
        print("Plan type distribution:")
        for plan_type, count in plan_type_counts.items():
            print(f"  {plan_type}: {count}")
        
        print("\nDetailed subscription information:")
        print("-" * 80)
        for sub in all_subscriptions:
            user = db.query(User).filter(User.id == sub.user_id).first()
            user_email = user.email if user else "Unknown user"
            print(f"ID: {sub.id}")
            print(f"  User: {user_email} ({sub.user_id})")
            print(f"  Plan Type: {sub.plan_type}")
            print(f"  Status: {sub.status}")
            print(f"  Stripe Subscription ID: {sub.stripe_subscription_id}")
            print(f"  Period: {sub.current_period_start} to {sub.current_period_end}")
            print(f"  Cancel at period end: {sub.cancel_at_period_end}")
            print("-" * 80)
            
    except Exception as e:
        print(f"Error checking subscriptions: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("Checking subscription data in database...\n")
    check_subscriptions()
    print("\nCheck completed.")

