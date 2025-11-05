#!/usr/bin/env python3
"""
Test script for Stripe payment integration
Run this script to validate the payment system setup
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_payment_endpoints():
    """Test the payment API endpoints"""
    
    # Configuration
    base_url = "http://localhost:8000"
    test_email = "test@example.com"
    
    print("🧪 Testing Stripe Payment Integration")
    print("=" * 50)
    
    # Test 1: Get available plans
    print("\n1. Testing GET /payments/plans")
    try:
        response = requests.get(f"{base_url}/payments/plans")
        if response.status_code == 200:
            plans = response.json()
            print(f"✅ Success! Found {len(plans)} plans:")
            for plan in plans:
                print(f"   - {plan['name']}: ${plan['price']/100:.2f}/{plan['interval']}")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Create user
    print("\n2. Testing POST /payments/users")
    try:
        user_data = {
            "email": test_email,
            "firebase_uid": "test_firebase_uid_123"
        }
        response = requests.post(f"{base_url}/payments/users", json=user_data)
        if response.status_code == 200:
            user = response.json()
            print(f"✅ Success! Created user with ID: {user['id']}")
            user_id = user['id']
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 3: Get user by email
    print("\n3. Testing GET /payments/users/email/{email}")
    try:
        response = requests.get(f"{base_url}/payments/users/email/{test_email}")
        if response.status_code == 200:
            user = response.json()
            print(f"✅ Success! Retrieved user: {user['email']}")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Create payment intent (one-time payment)
    print("\n4. Testing POST /payments/payment-intents")
    try:
        payment_data = {
            "amount": 999,  # $9.99
            "currency": "usd",
            "description": "Test payment for quiz access"
        }
        response = requests.post(
            f"{base_url}/payments/payment-intents?user_email={test_email}",
            json=payment_data
        )
        if response.status_code == 200:
            payment_intent = response.json()
            print(f"✅ Success! Created payment intent: {payment_intent['payment_intent_id']}")
            print(f"   Client secret: {payment_intent['client_secret'][:20]}...")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Get user subscriptions (should be empty)
    print("\n5. Testing GET /payments/users/{user_id}/subscriptions")
    try:
        response = requests.get(f"{base_url}/payments/users/{user_id}/subscriptions")
        if response.status_code == 200:
            subscriptions = response.json()
            print(f"✅ Success! User has {len(subscriptions)} subscriptions")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 6: Get user transactions (should be empty)
    print("\n6. Testing GET /payments/users/{user_id}/transactions")
    try:
        response = requests.get(f"{base_url}/payments/users/{user_id}/transactions")
        if response.status_code == 200:
            transactions = response.json()
            print(f"✅ Success! User has {len(transactions)} transactions")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 7: Health check
    print("\n7. Testing GET /payments/health")
    try:
        response = requests.get(f"{base_url}/payments/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Success! Payment service status: {health['status']}")
        else:
            print(f"❌ Failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Payment integration test completed!")
    print("\nNext steps:")
    print("1. Set up your Stripe account and get API keys")
    print("2. Update environment variables in .env file")
    print("3. Create subscription products and prices in Stripe Dashboard")
    print("4. Set up webhook endpoints")
    print("5. Test with real payment methods")

def test_stripe_configuration():
    """Test Stripe configuration"""
    print("\n🔧 Testing Stripe Configuration")
    print("=" * 30)
    
    # Check environment variables
    required_vars = [
        "STRIPE_SECRET_KEY",
        "STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_BASIC_PRICE_ID",
        "STRIPE_PREMIUM_PRICE_ID",
        "STRIPE_ENTERPRISE_PRICE_ID"
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value[:10]}..." if len(value) > 10 else f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: Not set")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n⚠️  Missing {len(missing_vars)} environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease update your .env file with the required variables.")
    else:
        print("\n✅ All required environment variables are set!")

if __name__ == "__main__":
    # Test configuration first
    test_stripe_configuration()
    
    # Test endpoints if server is running
    print("\n" + "=" * 50)
    print("Testing payment endpoints...")
    print("Make sure the FastAPI server is running on http://localhost:8000")
    
    try:
        test_payment_endpoints()
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to server at http://localhost:8000")
        print("Please start the server first:")
        print("cd backend && uvicorn backend.api:app --reload")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}") 