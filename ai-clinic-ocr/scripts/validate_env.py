#!/usr/bin/env python3
"""
Validate environment variables before commit/deploy.
Run: python scripts/validate_env.py
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from pydantic import ValidationError
from config import Settings


def validate_env() -> bool:
    """Validate all required environment variables are set."""
    print("🔍 Validating OCR service environment...")
    
    try:
        settings = Settings()
        
        errors = []
        
        # Check required fields
        if not settings.GEMINI_API_KEY.get_secret_value():
            errors.append("GEMINI_API_KEY is required but not set")
        
        # Validate CORS origins format
        origins = settings.get_cors_origins()
        if not origins:
            errors.append("CORS_ORIGINS must have at least one origin")
        
        for origin in origins:
            if not origin.startswith(("http://", "https://")):
                errors.append(f"Invalid CORS origin format: {origin}")
        
        # Validate port range
        if not (1 <= settings.PORT <= 65535):
            errors.append(f"PORT must be between 1 and 65535, got {settings.PORT}")
        
        if errors:
            print("❌ Environment validation failed:")
            for error in errors:
                print(f"   - {error}")
            return False
        
        print("✅ OCR service environment is valid")
        print(f"   - GEMINI_MODEL: {settings.GEMINI_MODEL}")
        print(f"   - HOST: {settings.HOST}")
        print(f"   - PORT: {settings.PORT}")
        print(f"   - CORS_ORIGINS: {', '.join(origins)}")
        return True
        
    except ValidationError as e:
        print("❌ Pydantic validation error:")
        for error in e.errors():
            print(f"   - {error['loc'][0]}: {error['msg']}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = validate_env()
    sys.exit(0 if success else 1)
