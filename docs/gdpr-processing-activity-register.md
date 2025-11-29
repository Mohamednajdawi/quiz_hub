# GDPR Processing Activity Register (Article 30)

**Organization**: Progrezz  
**Date Created**: 2025-01-27  
**Last Updated**: 2025-01-27  
**Version**: 1.0

---

## Overview

This register documents all personal data processing activities conducted by Progrezz in accordance with Article 30 of the General Data Protection Regulation (GDPR). This register must be made available to the Austrian Federal Ministry of Education, Science and Research (BMB) upon request.

---

## Processing Activity 1: User Account Management

### Controller
- **Name**: Progrezz
- **Contact**: [Contact information to be provided]

### Data Protection Officer (if applicable)
- **Contact**: [To be designated if required]

### Purpose of Processing
- User registration and authentication
- Account management and profile maintenance
- Service access control
- User communication

### Categories of Data Subjects
- Registered users (students, educators)
- Users must be at least 13 years old

### Categories of Personal Data
- **Identity Data**: User ID (UUID), email address, first name, last name
- **Demographic Data**: Birth date, gender
- **Authentication Data**: Password hash (bcrypt), Firebase UID (if applicable)
- **Account Data**: Account status (active/inactive), referral code, referred by code
- **Metadata**: Account creation timestamp, last update timestamp

### Recipients or Categories of Recipients
- Internal: Authorized staff with access to user management systems
- External: None (data stored in EU/EEA)

### Transfers to Third Countries
- None

### Retention Period
- Active accounts: For the duration of the account
- Deleted accounts: Personal data anonymized immediately upon deletion request
- Financial records: Retained for 7 years as required by Austrian tax law

### Security Measures
- Password hashing using bcrypt
- HTTPS encryption for data in transit
- Database encryption at rest
- Access controls and authentication required for all data access
- Regular security audits

---

## Processing Activity 2: Content Generation (Quizzes, Flashcards, Essays, Mind Maps)

### Purpose of Processing
- Generate educational content based on user-provided materials
- Create personalized learning materials
- Store user-generated content

### Categories of Data Subjects
- Registered users who create content

### Categories of Personal Data
- **Content Data**: Quiz topics, questions, flashcards, essay questions, mind maps
- **Source Material**: PDF files uploaded by users, text content provided by users
- **Metadata**: Creation timestamps, categories, difficulty levels, user preferences

### Recipients or Categories of Recipients
- **Sub-processor**: OpenAI (for AI content generation)
  - **Location**: OpenAI EU endpoints (to be verified)
  - **Data Transferred**: User-provided text content, prompts
  - **Purpose**: AI model processing for content generation
  - **Legal Basis**: Article 28(4) GDPR contract required

### Transfers to Third Countries
- **OpenAI**: Data may be processed in US data centers (requires Article 28 contract and adequacy decision verification)
- **Status**: ⚠️ **REQUIRES VERIFICATION** - Must confirm EU/EEA processing or implement appropriate safeguards

### Retention Period
- User-created content: Until user deletion request
- Generated content: Stored until user deletes associated project or content
- PDF files: Deleted from disk upon content deletion

### Security Measures
- Encrypted file storage
- Access controls (users can only access their own content)
- Secure file upload validation
- PDF files stored in secure, access-controlled directories

---

## Processing Activity 3: Learning Analytics and Performance Tracking

### Purpose of Processing
- Track user learning progress
- Generate performance analytics
- Provide personalized feedback
- Improve learning recommendations

### Categories of Data Subjects
- Registered users who take quizzes or answer essay questions

### Categories of Personal Data
- **Performance Data**: Quiz scores, percentage scores, time taken per question
- **Answer Data**: User answers, correct answers, question performance details
- **Analytics Data**: Total quizzes taken, average scores, best scores, total time spent
- **Feedback Data**: AI-generated feedback based on performance
- **Metadata**: Timestamps, difficulty levels, source information

### Recipients or Categories of Recipients
- Internal: Authorized staff for analytics and product improvement
- **Sub-processor**: OpenAI (for AI feedback generation)
  - **Location**: OpenAI EU endpoints (to be verified)
  - **Data Transferred**: Performance data, question details, user answers
  - **Purpose**: Generate personalized learning feedback

### Transfers to Third Countries
- **OpenAI**: See Processing Activity 2

### Retention Period
- Quiz attempts: Retained until user account deletion
- Analytics data: Aggregated and anonymized after 2 years
- Individual performance records: Deleted upon user deletion request

### Security Measures
- Data anonymization for aggregated analytics
- Access controls for individual performance data
- Encryption of sensitive performance metrics

---

## Processing Activity 4: Payment Processing

### Purpose of Processing
- Process subscription payments
- Manage billing and invoicing
- Handle payment method storage
- Transaction record keeping

### Categories of Data Subjects
- Registered users with active subscriptions

### Categories of Personal Data
- **Payment Data**: Stripe customer ID, payment method IDs, transaction amounts
- **Subscription Data**: Plan type, subscription status, billing period dates
- **Billing Data**: Transaction history, payment status, invoice information
- **Note**: Full payment card details are NOT stored - processed by Stripe

### Recipients or Categories of Recipients
- **Sub-processor**: Stripe, Inc.
  - **Location**: Stripe EU/EEA data centers (to be verified)
  - **Data Transferred**: Payment information, customer IDs, subscription details
  - **Purpose**: Payment processing, subscription management
  - **Legal Basis**: Article 28(4) GDPR contract required

### Transfers to Third Countries
- **Stripe**: Must verify EU/EEA processing location
- **Status**: ⚠️ **REQUIRES VERIFICATION** - Stripe may process in US (requires Article 28 contract)

### Retention Period
- Transaction records: 7 years (Austrian tax law requirement)
- Subscription data: Retained while subscription is active, then 7 years for legal compliance
- Payment methods: Deleted upon user request, but transaction records retained

### Security Measures
- PCI DSS compliance (via Stripe)
- No storage of full payment card numbers
- Encrypted transmission of payment data
- Secure webhook handling for payment events

---

## Processing Activity 5: File Storage (PDF Uploads)

### Purpose of Processing
- Store user-uploaded PDF files for content generation
- Enable content extraction and processing
- Provide persistent storage for user projects

### Categories of Data Subjects
- Registered users who upload PDF files

### Categories of Personal Data
- **File Data**: PDF file content (may contain personal information from uploaded documents)
- **Metadata**: File names, upload timestamps, file sizes, content types
- **Storage Location**: Railway volume storage (EU/EEA location to be verified)

### Recipients or Categories of Recipients
- **Sub-processor**: Railway (hosting provider)
  - **Location**: Railway data centers (EU/EEA location to be verified)
  - **Data Transferred**: PDF files, file metadata
  - **Purpose**: File storage and hosting
  - **Legal Basis**: Article 28(4) GDPR contract required

### Transfers to Third Countries
- **Railway**: Must verify EU/EEA data center location
- **Status**: ⚠️ **REQUIRES VERIFICATION**

### Retention Period
- PDF files: Until user deletes associated content or project
- Deleted files: Removed from disk immediately upon deletion request

### Security Measures
- Secure file upload validation
- File size limits
- Virus scanning (to be implemented)
- Access controls (users can only access their own files)
- Encrypted storage

---

## Processing Activity 6: Token Usage Tracking

### Purpose of Processing
- Track AI generation token usage for cost management
- Monitor user generation quotas
- Provide usage statistics to administrators

### Categories of Data Subjects
- All registered users

### Categories of Personal Data
- **Usage Data**: Input tokens, output tokens, total tokens per generation
- **Metadata**: Generation type (quiz, flashcard, essay, mind map), timestamps, topic IDs
- **Quota Data**: Monthly generation counts, free token balances

### Recipients or Categories of Recipients
- Internal: Administrators for usage monitoring and cost analysis
- No external recipients

### Transfers to Third Countries
- None

### Retention Period
- Token usage records: Retained for 2 years for cost analysis
- Aggregated statistics: Retained indefinitely (anonymized)

### Security Measures
- Access controls (admin-only access)
- Data anonymization for aggregated statistics
- Encryption of usage records

---

## Processing Activity 7: Referral Program

### Purpose of Processing
- Track referral relationships
- Manage referral rewards
- Prevent referral fraud

### Categories of Data Subjects
- Registered users who participate in referral program

### Categories of Personal Data
- **Referral Data**: Referral codes, referrer IDs, referred user IDs
- **Status Data**: Referral status (pending, completed, etc.)
- **Metadata**: Referral creation timestamps

### Recipients or Categories of Recipients
- Internal: Authorized staff for referral program management
- No external recipients

### Transfers to Third Countries
- None

### Retention Period
- Referral records: Retained until user account deletion
- Deleted upon user deletion request

### Security Measures
- Unique referral code generation
- Fraud detection mechanisms
- Access controls

---

## Sub-Processors Summary

### 1. OpenAI
- **Service**: AI content generation and feedback
- **Location**: ⚠️ **REQUIRES VERIFICATION** (US/EU)
- **Data Processed**: User-provided text, prompts, performance data
- **Article 28 Contract**: ⚠️ **REQUIRED** - Not yet in place
- **Status**: Critical - Must verify EU/EEA processing or implement safeguards

### 2. Stripe, Inc.
- **Service**: Payment processing
- **Location**: ⚠️ **REQUIRES VERIFICATION** (US/EU)
- **Data Processed**: Payment information, customer IDs, subscription data
- **Article 28 Contract**: ⚠️ **REQUIRED** - Not yet in place
- **Status**: Critical - Must verify EU/EEA processing or implement safeguards

### 3. Railway
- **Service**: Cloud hosting and file storage
- **Location**: ⚠️ **REQUIRES VERIFICATION** (US/EU)
- **Data Processed**: All application data, PDF files, database
- **Article 28 Contract**: ⚠️ **REQUIRED** - Not yet in place
- **Status**: Critical - Must verify EU/EEA data center location and ISO 27001 certification

---

## Legal Basis for Processing

### Article 6(1)(b) - Contract Performance
- User account management
- Content generation services
- Payment processing
- File storage

### Article 6(1)(f) - Legitimate Interests
- Learning analytics and performance tracking
- Token usage tracking
- Referral program management
- Service improvement and optimization

### Article 6(1)(a) - Consent
- Optional marketing communications (if implemented)
- Cookie preferences (currently disabled for BMB compliance)

---

## Data Subject Rights Implementation

All data subject rights under GDPR Articles 12-23 are implemented via API endpoints:

- **Article 15**: Right of access - `GET /gdpr/data-access`
- **Article 16**: Right to rectification - `PUT /gdpr/data-rectification`
- **Article 17**: Right to erasure - `DELETE /gdpr/data-erasure`
- **Article 18**: Right to restriction - `POST /gdpr/processing-restriction`
- **Article 20**: Right to data portability - `POST /gdpr/data-export`
- **Article 21**: Right to object - `POST /gdpr/object-processing`

---

## Security Measures (Technical and Organizational)

### Technical Measures
1. **Encryption**:
   - HTTPS/TLS for all data in transit
   - Database encryption at rest
   - Encrypted file storage

2. **Access Controls**:
   - Authentication required for all API endpoints
   - Role-based access control (admin vs. user)
   - Database-level access controls

3. **Data Integrity**:
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection

4. **Monitoring**:
   - Application logging
   - Error tracking
   - Security event monitoring (to be enhanced)

### Organizational Measures
1. **Staff Training**: Data protection training for all staff with data access
2. **Confidentiality Agreements**: Required for all staff
3. **Access Logging**: All data access logged and auditable
4. **Incident Response**: Data breach notification procedure in place

---

## Data Breach Notification

- **Procedure**: See `docs/data-breach-notification-procedure.md`
- **Notification Timeline**: Within 72 hours to BMB (datenschutz@bmb.gv.at)
- **Contact**: [To be designated]

---

## Review and Updates

This register must be reviewed and updated:
- Annually
- When new processing activities are introduced
- When sub-processors change
- When data retention periods change
- Upon request from BMB

**Next Review Date**: 2026-01-27

---

## Approval

**Prepared by**: [Name]  
**Date**: 2025-01-27  
**Approved by**: [Name/Title]  
**Date**: [Date]

---

## Appendix: Database Schema Overview

### Tables Containing Personal Data
1. **users**: User account information
2. **subscriptions**: Subscription and billing data
3. **payment_methods**: Payment method references (Stripe IDs)
4. **transactions**: Transaction history
5. **quiz_attempts**: Quiz performance data
6. **quiz_topics**: User-created quiz content
7. **flashcard_topics**: User-created flashcard content
8. **Essay_qa_topics**: User-created essay content
9. **essay_answers**: User essay answers and performance
10. **student_projects**: User project data
11. **student_project_contents**: Uploaded PDF files and content
12. **mind_maps**: User-created mind maps
13. **referrals**: Referral program data
14. **token_usage**: Token usage tracking
15. **generation_jobs**: Background job processing data

---

**END OF REGISTER**

