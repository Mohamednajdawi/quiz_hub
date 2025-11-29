"""
Data Breach Notification Utility

Provides functions to assist with GDPR Article 33 (BMB notification) compliance.
This module helps automate breach notification processes.
"""

import logging
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional
import os

logger = logging.getLogger(__name__)

# BMB Data Protection Office Contact
BMB_EMAIL = "datenschutz@bmb.gv.at"

# Breach notification email configuration (to be set via environment variables)
BREACH_NOTIFICATION_FROM_EMAIL = os.getenv("BREACH_NOTIFICATION_FROM_EMAIL", "")
BREACH_NOTIFICATION_SMTP_HOST = os.getenv("BREACH_NOTIFICATION_SMTP_HOST", "smtp.gmail.com")
BREACH_NOTIFICATION_SMTP_PORT = int(os.getenv("BREACH_NOTIFICATION_SMTP_PORT", "587"))
BREACH_NOTIFICATION_SMTP_USER = os.getenv("BREACH_NOTIFICATION_SMTP_USER", "")
BREACH_NOTIFICATION_SMTP_PASSWORD = os.getenv("BREACH_NOTIFICATION_SMTP_PASSWORD", "")


class BreachAssessment:
    """Represents a data breach assessment"""
    
    def __init__(
        self,
        discovery_time: datetime,
        breach_type: str,  # "confidentiality", "integrity", "availability"
        affected_data_categories: List[str],
        estimated_data_subjects: int,
        estimated_records: int,
        description: str,
        risk_level: str = "medium",  # "high", "medium", "low"
        contained: bool = False,
    ):
        self.discovery_time = discovery_time
        self.breach_type = breach_type
        self.affected_data_categories = affected_data_categories
        self.estimated_data_subjects = estimated_data_subjects
        self.estimated_records = estimated_records
        self.description = description
        self.risk_level = risk_level
        self.contained = contained
        self.breach_time: Optional[datetime] = None
        self.measures_taken: List[str] = []
        self.measures_proposed: List[str] = []
        self.likely_consequences: str = ""
        
    def requires_bmb_notification(self) -> bool:
        """
        Determine if BMB notification is required.
        Per GDPR Article 33, notification is required if breach is likely to result
        in a risk to the rights and freedoms of natural persons.
        """
        # For BMB compliance, any breach involving BMB users requires notification
        # High and medium risk breaches always require notification
        return self.risk_level in ["high", "medium"] or self.estimated_data_subjects > 0
    
    def requires_data_subject_notification(self) -> bool:
        """
        Determine if data subject notification is required.
        Per GDPR Article 34, notification is required if breach is likely to result
        in HIGH RISK to the rights and freedoms of natural persons.
        """
        return self.risk_level == "high"


def generate_bmb_notification_email(assessment: BreachAssessment, contact_info: Dict[str, str]) -> str:
    """
    Generate BMB notification email content.
    
    Args:
        assessment: Breach assessment details
        contact_info: Dictionary with 'name', 'email', 'phone', 'title'
    
    Returns:
        Formatted email content
    """
    breach_time_str = assessment.breach_time.strftime("%Y-%m-%d %H:%M:%S") if assessment.breach_time else "Unknown"
    discovery_time_str = assessment.discovery_time.strftime("%Y-%m-%d %H:%M:%S")
    
    email_content = f"""Subject: [URGENT] Data Breach Notification - Progrezz - {discovery_time_str}

To: {BMB_EMAIL}

Dear BMB Data Protection Office,

We are writing to notify you of a personal data breach in accordance with GDPR Article 33.

BREACH DETAILS:
- Discovery Date/Time: {discovery_time_str}
- Breach Time (if known): {breach_time_str}
- Breach Type: {assessment.breach_type.title()}
- Affected Data Categories: {', '.join(assessment.affected_data_categories)}
- Estimated Number of Data Subjects: {assessment.estimated_data_subjects}
- Estimated Number of Records: {assessment.estimated_records}
- Risk Level: {assessment.risk_level.upper()}
- Containment Status: {'Contained' if assessment.contained else 'Not Contained'}

NATURE OF THE BREACH:
{assessment.description}

LIKELY CONSEQUENCES:
{assessment.likely_consequences if assessment.likely_consequences else 'To be assessed'}

MEASURES TAKEN:
{chr(10).join(f'- {measure}' for measure in assessment.measures_taken) if assessment.measures_taken else 'Immediate containment measures in progress'}

MEASURES PROPOSED:
{chr(10).join(f'- {measure}' for measure in assessment.measures_proposed) if assessment.measures_proposed else 'To be determined'}

CONTACT INFORMATION:
Name: {contact_info.get('name', 'To be designated')}
Title: {contact_info.get('title', 'Data Protection Officer')}
Email: {contact_info.get('email', 'To be designated')}
Phone: {contact_info.get('phone', 'To be designated')}

We will provide updates as the investigation progresses.

Sincerely,
{contact_info.get('name', 'Progrezz Team')}
{contact_info.get('title', '')}
Progrezz
"""
    return email_content


def send_bmb_notification(assessment: BreachAssessment, contact_info: Dict[str, str]) -> bool:
    """
    Send BMB notification email.
    
    Args:
        assessment: Breach assessment
        contact_info: Contact information for DPO/contact person
    
    Returns:
        True if email sent successfully, False otherwise
    """
    if not BREACH_NOTIFICATION_FROM_EMAIL:
        logger.error("[BREACH] BREACH_NOTIFICATION_FROM_EMAIL not configured. Cannot send notification email.")
        logger.warning("[BREACH] Manual notification required. Email content:")
        email_content = generate_bmb_notification_email(assessment, contact_info)
        logger.warning(email_content)
        return False
    
    try:
        # Create email
        msg = MIMEMultipart()
        msg['From'] = BREACH_NOTIFICATION_FROM_EMAIL
        msg['To'] = BMB_EMAIL
        msg['Subject'] = f"[URGENT] Data Breach Notification - Progrezz - {assessment.discovery_time.strftime('%Y-%m-%d')}"
        
        # Add body
        body = generate_bmb_notification_email(assessment, contact_info)
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        if BREACH_NOTIFICATION_SMTP_USER and BREACH_NOTIFICATION_SMTP_PASSWORD:
            server = smtplib.SMTP(BREACH_NOTIFICATION_SMTP_HOST, BREACH_NOTIFICATION_SMTP_PORT)
            server.starttls()
            server.login(BREACH_NOTIFICATION_SMTP_USER, BREACH_NOTIFICATION_SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info(f"[BREACH] BMB notification email sent successfully at {datetime.now()}")
            return True
        else:
            logger.error("[BREACH] SMTP credentials not configured. Cannot send email.")
            logger.warning("[BREACH] Manual notification required. Email content:")
            logger.warning(body)
            return False
            
    except Exception as e:
        logger.error(f"[BREACH] Failed to send BMB notification email: {e}")
        logger.warning("[BREACH] Manual notification required. Email content:")
        email_content = generate_bmb_notification_email(assessment, contact_info)
        logger.warning(email_content)
        return False


def log_breach(assessment: BreachAssessment, notification_sent: bool = False) -> None:
    """
    Log breach to breach log file.
    
    Args:
        assessment: Breach assessment
        notification_sent: Whether BMB notification was sent
    """
    log_entry = f"""
=== DATA BREACH LOG ENTRY ===
Timestamp: {datetime.now().isoformat()}
Discovery Time: {assessment.discovery_time.isoformat()}
Breach Time: {assessment.breach_time.isoformat() if assessment.breach_time else 'Unknown'}
Breach Type: {assessment.breach_type}
Affected Data Categories: {', '.join(assessment.affected_data_categories)}
Estimated Data Subjects: {assessment.estimated_data_subjects}
Estimated Records: {assessment.estimated_records}
Risk Level: {assessment.risk_level}
Contained: {assessment.contained}
BMB Notification Sent: {notification_sent}
Description: {assessment.description}
Measures Taken: {', '.join(assessment.measures_taken) if assessment.measures_taken else 'None'}
Measures Proposed: {', '.join(assessment.measures_proposed) if assessment.measures_proposed else 'None'}
================================
"""
    
    # Log to application log
    logger.warning(log_entry)
    
    # Optionally write to dedicated breach log file
    breach_log_path = os.getenv("BREACH_LOG_PATH", "logs/breach_log.txt")
    try:
        os.makedirs(os.path.dirname(breach_log_path), exist_ok=True)
        with open(breach_log_path, "a") as f:
            f.write(log_entry)
    except Exception as e:
        logger.error(f"[BREACH] Failed to write to breach log file: {e}")


def assess_and_notify_breach(
    breach_type: str,
    affected_data_categories: List[str],
    estimated_data_subjects: int,
    estimated_records: int,
    description: str,
    risk_level: str = "medium",
    contained: bool = False,
    breach_time: Optional[datetime] = None,
    measures_taken: Optional[List[str]] = None,
    measures_proposed: Optional[List[str]] = None,
    likely_consequences: Optional[str] = None,
    contact_info: Optional[Dict[str, str]] = None,
) -> bool:
    """
    High-level function to assess breach and send notification if required.
    
    Args:
        breach_type: Type of breach ("confidentiality", "integrity", "availability")
        affected_data_categories: List of data categories affected
        estimated_data_subjects: Estimated number of affected users
        estimated_records: Estimated number of records affected
        description: Description of the breach
        risk_level: Risk level ("high", "medium", "low")
        contained: Whether breach is contained
        breach_time: When the breach occurred (if known)
        measures_taken: List of measures already taken
        measures_proposed: List of proposed measures
        likely_consequences: Description of likely consequences
        contact_info: Contact information dict (name, email, phone, title)
    
    Returns:
        True if notification was sent, False otherwise
    """
    assessment = BreachAssessment(
        discovery_time=datetime.now(),
        breach_type=breach_type,
        affected_data_categories=affected_data_categories,
        estimated_data_subjects=estimated_data_subjects,
        estimated_records=estimated_records,
        description=description,
        risk_level=risk_level,
        contained=contained,
    )
    
    if breach_time:
        assessment.breach_time = breach_time
    if measures_taken:
        assessment.measures_taken = measures_taken
    if measures_proposed:
        assessment.measures_proposed = measures_proposed
    if likely_consequences:
        assessment.likely_consequences = likely_consequences
    
    # Log breach
    log_breach(assessment, notification_sent=False)
    
    # Check if notification required
    if assessment.requires_bmb_notification():
        logger.warning(f"[BREACH] BMB notification required. Risk level: {risk_level}")
        
        # Default contact info if not provided
        if not contact_info:
            contact_info = {
                "name": "Data Protection Officer",
                "email": BREACH_NOTIFICATION_FROM_EMAIL or "dpo@progrezz.com",
                "phone": "To be designated",
                "title": "Data Protection Officer",
            }
        
        # Send notification
        notification_sent = send_bmb_notification(assessment, contact_info)
        
        # Update log
        if notification_sent:
            log_breach(assessment, notification_sent=True)
        
        return notification_sent
    else:
        logger.info(f"[BREACH] BMB notification not required. Risk level: {risk_level}")
        return False

