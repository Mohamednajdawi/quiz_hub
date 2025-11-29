# Data Breach Notification Procedure

**Organization**: Progrezz  
**Date Created**: 2025-01-27  
**Version**: 1.0  
**BMB Contact**: datenschutz@bmb.gv.at

---

## Overview

This procedure outlines the steps to be taken in the event of a personal data breach, in accordance with GDPR Article 33 (notification to supervisory authority) and Article 34 (communication to data subjects), as required by the BMB data protection agreement.

---

## Definitions

### Personal Data Breach
A breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data transmitted, stored or otherwise processed.

### Types of Breaches
1. **Confidentiality Breach**: Unauthorized disclosure of personal data
2. **Integrity Breach**: Unauthorized alteration of personal data
3. **Availability Breach**: Accidental or unlawful loss of access to personal data

---

## Breach Detection and Initial Response

### Step 1: Immediate Containment (Within 1 Hour)
Upon discovery of a suspected breach:

1. **Isolate Affected Systems**
   - Disable affected user accounts if necessary
   - Block suspicious IP addresses
   - Revoke compromised API keys or access tokens
   - Take affected systems offline if required

2. **Preserve Evidence**
   - Document the breach discovery time and circumstances
   - Take screenshots or logs of suspicious activity
   - Preserve system logs and access records
   - Do NOT delete any evidence

3. **Notify Internal Team**
   - Immediately notify: [Data Protection Officer / Technical Lead]
   - Contact: [Contact information]
   - Activate breach response team

### Step 2: Assessment (Within 4 Hours)

**Assess the Breach:**

1. **Determine Scope**
   - What data was affected?
   - How many data subjects are impacted?
   - What type of personal data was involved?
   - When did the breach occur?
   - How was the breach discovered?

2. **Categorize Risk Level**
   - **HIGH RISK**: Sensitive data (payment info, passwords), large number of users, ongoing breach
   - **MEDIUM RISK**: Moderate number of users, non-sensitive data, contained breach
   - **LOW RISK**: Minimal data, no sensitive information, fully contained

3. **Document Assessment**
   - Complete Breach Assessment Form (see Appendix A)
   - Record all findings
   - Estimate number of affected data subjects

### Step 3: Notification Decision (Within 8 Hours)

**Determine Notification Requirements:**

1. **BMB Notification Required If:**
   - Breach is likely to result in a risk to the rights and freedoms of natural persons
   - ANY breach involving personal data of BMB users
   - **Timeline**: Within 72 hours of becoming aware of the breach

2. **Data Subject Notification Required If:**
   - Breach is likely to result in a HIGH RISK to the rights and freedoms of natural persons
   - **Timeline**: Without undue delay after becoming aware of the breach

3. **Exception to Data Subject Notification:**
   - If encryption or other protective measures render data unintelligible
   - If measures have been taken to mitigate the risk
   - If notification would involve disproportionate effort (e.g., public announcement)

---

## BMB Notification (Article 33)

### Timeline
- **Required**: Within 72 hours of becoming aware of the breach
- **Target**: Within 24 hours for high-risk breaches
- **Contact**: datenschutz@bmb.gv.at

### Notification Content

**Email Subject**: `[URGENT] Data Breach Notification - Progrezz - [Date]`

**Required Information:**

1. **Nature of the Breach**
   - Description of what happened
   - Type of breach (confidentiality, integrity, availability)
   - Categories and approximate number of data subjects concerned
   - Categories and approximate number of personal data records concerned

2. **Data Protection Officer Contact**
   - Name and contact details of DPO (if designated)
   - Or contact person for breach inquiries

3. **Likely Consequences**
   - Description of likely consequences of the breach
   - Potential impact on data subjects

4. **Measures Proposed or Taken**
   - Immediate containment measures
   - Remediation steps taken
   - Measures to mitigate adverse effects
   - Preventive measures to prevent recurrence

### Notification Template

```
Subject: [URGENT] Data Breach Notification - Progrezz - [Date]

To: datenschutz@bmb.gv.at

Dear BMB Data Protection Office,

We are writing to notify you of a personal data breach in accordance with GDPR Article 33.

BREACH DETAILS:
- Discovery Date/Time: [Date and Time]
- Breach Type: [Confidentiality/Integrity/Availability]
- Affected Data Categories: [List categories]
- Estimated Number of Data Subjects: [Number]
- Estimated Number of Records: [Number]

NATURE OF THE BREACH:
[Detailed description of what happened, how it was discovered, and the circumstances]

LIKELY CONSEQUENCES:
[Description of potential impact on data subjects]

MEASURES TAKEN:
[Immediate containment and remediation measures]

MEASURES PROPOSED:
[Future preventive measures]

CONTACT INFORMATION:
Data Protection Officer: [Name]
Email: [Email]
Phone: [Phone]

We will provide updates as the investigation progresses.

Sincerely,
[Name]
[Title]
Progrezz
```

### Follow-Up Notification
If all information is not available within 72 hours:
- Provide initial notification with available information
- Provide additional information in phases without undue further delay

---

## Data Subject Notification (Article 34)

### When Required
- Breach is likely to result in HIGH RISK to rights and freedoms
- Must be communicated without undue delay

### Notification Method
1. **Individual Notification** (Preferred)
   - Email to affected users
   - In-app notification
   - Postal mail if email unavailable

2. **Public Communication** (If Individual Not Feasible)
   - Website announcement
   - Public statement
   - Only if individual notification would involve disproportionate effort

### Notification Content

**Required Information:**

1. **Clear Description**
   - What happened in plain language
   - When the breach occurred
   - What data was affected

2. **Likely Consequences**
   - Potential impact on the data subject
   - Risks to their rights and freedoms

3. **Measures Taken**
   - What we've done to address the breach
   - Steps to mitigate adverse effects

4. **Recommended Actions**
   - What the data subject should do (e.g., change password, monitor accounts)
   - Contact information for support

### Notification Template (Email)

```
Subject: Important: Security Notice Regarding Your Progrezz Account

Dear [User Name],

We are writing to inform you of a security incident that may have affected your Progrezz account.

WHAT HAPPENED:
[Clear description of the breach]

WHAT DATA WAS AFFECTED:
[Specific information about what personal data was involved]

WHAT WE'VE DONE:
[Immediate actions taken to address the breach]

WHAT YOU SHOULD DO:
[Recommended actions for the user]

We take data security seriously and sincerely apologize for any concern this may cause.

If you have questions, please contact us at: [Support Email]

Sincerely,
Progrezz Security Team
```

---

## Breach Response Team

### Roles and Responsibilities

1. **Incident Coordinator**
   - Overall breach response coordination
   - Decision-making authority
   - Contact: [Name/Email/Phone]

2. **Technical Lead**
   - System containment and remediation
   - Forensic investigation
   - Contact: [Name/Email/Phone]

3. **Legal/Compliance Lead**
   - Notification requirements assessment
   - Regulatory compliance
   - Contact: [Name/Email/Phone]

4. **Communications Lead**
   - Data subject notifications
   - Public communications (if needed)
   - Contact: [Name/Email/Phone]

5. **Data Protection Officer** (if designated)
   - Oversight of breach response
   - BMB liaison
   - Contact: [Name/Email/Phone]

---

## Post-Breach Actions

### Immediate (Within 24 Hours)
1. Complete breach assessment
2. Send BMB notification (if required)
3. Implement containment measures
4. Begin forensic investigation

### Short-Term (Within 1 Week)
1. Complete forensic investigation
2. Send data subject notifications (if required)
3. Implement immediate remediation measures
4. Document lessons learned

### Long-Term (Within 1 Month)
1. Implement preventive measures
2. Update security procedures
3. Conduct post-incident review
4. Update breach response procedure if needed
5. Provide final report to BMB (if requested)

---

## Breach Log

All breaches must be logged, regardless of whether notification is required.

**Log Entry Should Include:**
- Date and time of discovery
- Date and time of breach (if known)
- Type of breach
- Affected data categories
- Number of data subjects
- Notification status (BMB, data subjects)
- Remediation measures
- Preventive measures implemented

---

## Testing and Training

### Annual Breach Response Drill
- Simulate a data breach scenario
- Test notification procedures
- Review and update procedures
- Train staff on breach recognition and response

### Staff Training
- All staff with data access must be trained on:
  - Recognizing potential breaches
  - Initial response procedures
  - Escalation procedures
  - Documentation requirements

---

## Appendix A: Breach Assessment Form

**Date/Time of Discovery**: _______________  
**Discovered By**: _______________  
**Date/Time of Breach** (if known): _______________

**Breach Type**:
- [ ] Confidentiality (unauthorized disclosure)
- [ ] Integrity (unauthorized alteration)
- [ ] Availability (loss of access)

**Affected Data Categories**:
- [ ] User account information
- [ ] Payment information
- [ ] Content data
- [ ] Performance/analytics data
- [ ] Other: _______________

**Estimated Number of Data Subjects**: _______________  
**Estimated Number of Records**: _______________

**Risk Level**:
- [ ] High
- [ ] Medium
- [ ] Low

**Containment Status**:
- [ ] Contained
- [ ] Partially contained
- [ ] Not contained

**Notification Status**:
- [ ] BMB notified (Date/Time: _______________)
- [ ] Data subjects notified (Date/Time: _______________)
- [ ] Notification not required (Reason: _______________)

**Description of Breach**:
_________________________________________________
_________________________________________________

**Immediate Actions Taken**:
_________________________________________________
_________________________________________________

**Remediation Measures**:
_________________________________________________
_________________________________________________

**Preventive Measures**:
_________________________________________________
_________________________________________________

**Assessed By**: _______________  
**Date**: _______________

---

## Contact Information

**BMB Data Protection Office**:
- Email: datenschutz@bmb.gv.at
- Address: [To be added]

**Progrezz Breach Response**:
- Emergency Contact: [To be designated]
- Email: [To be designated]
- Phone: [To be designated]

---

**END OF PROCEDURE**

