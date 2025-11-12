"""
Migration script to fix subscription plan_type values.
This script updates subscriptions with "unknown" plan_type to "premium" (which maps to "pro" in the frontend).
For active subscriptions, we assume they are "premium" (pro) plans since that's the main paid tier.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from backend.database.db import SessionLocal, engine
from backend.database.sqlite_dal import Subscription, Base


def fix_subscription_plan_types():
    """Fix subscriptions with 'unknown' plan_type"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Find all subscriptions with "unknown" plan_type
        unknown_subscriptions = db.query(Subscription).filter(
            Subscription.plan_type == "unknown"
        ).all()
        
        if not unknown_subscriptions:
            print("No subscriptions with 'unknown' plan_type found.")
            return
        
        print(f"Found {len(unknown_subscriptions)} subscription(s) with 'unknown' plan_type.")
        
        # Update them to "premium" (which will be displayed as "pro" in the frontend)
        updated_count = 0
        for subscription in unknown_subscriptions:
            print(f"Updating subscription {subscription.id} (user: {subscription.user_id}, status: {subscription.status})")
            subscription.plan_type = "premium"
            updated_count += 1
        
        db.commit()
        print(f"Successfully updated {updated_count} subscription(s) to 'premium' plan_type.")
        
        # Also check for any other edge cases
        all_subscriptions = db.query(Subscription).all()
        print(f"\nCurrent subscription plan_type distribution:")
        plan_type_counts = {}
        for sub in all_subscriptions:
            plan_type = sub.plan_type
            plan_type_counts[plan_type] = plan_type_counts.get(plan_type, 0) + 1
        
        for plan_type, count in plan_type_counts.items():
            print(f"  {plan_type}: {count}")
            
    except Exception as e:
        print(f"Error fixing subscription plan types: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting subscription plan_type fix migration...")
    fix_subscription_plan_types()
    print("Migration completed.")

