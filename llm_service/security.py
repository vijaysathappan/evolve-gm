import re
import logging
from fastapi import HTTPException
from typing import Optional

# Configure production-standard logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("edge_security")

# Configuration Constants
MAX_QUERY_LENGTH = 10000
MIN_QUERY_LENGTH = 1

# 1. Advanced Prompt Injection Patterns
PROMPT_INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?previous\s+instructions",
    r"(?i)forget\s+all\s+instructions",
    r"(?i)system\s+prompt",
    r"(?i)you\s+are\s+now",
    r"(?i)jailbreak",
    r"(?i)bypass(\s+this)?",
    r"(?i)developer\s+mode",
    r"(?i)dan\s+mode",
    r"(?i)do\s+anything\s+now",
    r"(?i)respond\s+with\s+\"(\w+\s*)+\"",
    r"(?i)translate\s+the\s+following\s+system",
    r"(?i)act\s+as\s+(an|a)\s+(unrestricted|unfiltered)",
]

# 2. XSS and Malicious Payload Patterns
MALICIOUS_PAYLOAD_PATTERNS = [
    r"(?i)<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>",
    r"(?i)javascript:",
    r"(?i)onload=",
    r"(?i)onerror=",
    r"(?i)document\.cookie",
    r"(?i)eval\(",
    r"(?i)alert\(",
]

# 3. Basic PII Detection Patterns (e.g., Credit Cards, SSN)
# Use this strictly for enterprise environments demanding compliance
PII_PATTERNS = {
    "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
}

def sanitize_input(query: str) -> str:
    """
    Remove null bytes and structural malformations. Remove excessive whitespace.
    """
    query = query.replace("\x00", "")
    query = " ".join(query.split())
    return query

def check_length_constraints(query: str):
    """
    Protects against DDOS / Cost-burning vectors via massive prompts.
    """
    length = len(query)
    if length < MIN_QUERY_LENGTH:
         raise HTTPException(status_code=400, detail="Query is too short.")
    if length > MAX_QUERY_LENGTH:
         logger.warning(f"Query rejected: Exceeded maximum length ({length} chars)")
         raise HTTPException(status_code=400, detail="Query exceeds maximum allowed length.")

def detect_pii(query: str):
    """
    Scans for highly sensitive PII data to block or heavily warn the system.
    """
    for pii_type, pattern in PII_PATTERNS.items():
        if re.search(pattern, query):
            logger.warning(f"Query rejected: Detected {pii_type} data in input.")
            raise HTTPException(
                status_code=400, 
                detail="Personal Identifiable Information (PII) is not permitted in queries."
            )

def detect_prompt_injection(query: str):
    """
    Uses heuristics to detect adversarial prompt injection attempts (DAN, Developer Mode).
    """
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, query):
            logger.warning(f"Security Alert: Prompt Injection detected using pattern: '{pattern}'")
            raise HTTPException(
                status_code=403, 
                detail="Security guardrails blocked the request due to policy violation."
            )

def detect_malicious_payloads(query: str):
    """
    Blocks executable code payloads and XSS sequences to protect the web interfaces downstream.
    """
    for pattern in MALICIOUS_PAYLOAD_PATTERNS:
        if re.search(pattern, query):
            logger.error(f"Security Alert: Malicious payload/XSS detected using pattern: '{pattern}'")
            raise HTTPException(
                status_code=403, 
                detail="Executable payloads and scripts are prohibited."
            )

def validate_query_security(query: str) -> str:
    """
    Master Security Pipeline: Performs a comprehensive sequential security verification
    on the user query before authorizing it to pass to the LLM agent environment.
    Raises an HTTPException gracefully intercepted by FastAPI if the query fails security rules.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    # 1. Base string sanitation
    safe_query = sanitize_input(query)
    
    # 2. Length threshold verification
    check_length_constraints(safe_query)
    
    # 3. Payload and script ingestion detection
    detect_malicious_payloads(safe_query)
    
    # 4. Prompt injection filtering
    detect_prompt_injection(safe_query)
    
    # Note: PII detection is disabled by default to allow users flexibility. 
    # Can be enabled in environments requiring strict SOC2 / PII scrubbing compliance.
    # detect_pii(safe_query)

    logger.info("Query successfully passed all edge security verifications.")
    
    # Output the securely stripped query
    return safe_query
