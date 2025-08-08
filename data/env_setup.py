import os
from dotenv import load_dotenv
from pathlib import Path

def load_env_variables():
    """Load environment variables from .env files"""
    # Get the project root directory (assuming this script is in data/ folder)
    project_root = Path(__file__).parent.parent
    
    # Load .env files
    load_dotenv(project_root / '.env')
    load_dotenv(project_root / '.env.local')
    
    # Verify MISTRAL_API_KEY is loaded
    api_key = os.getenv('MISTRAL_API_KEY')
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not found in environment variables. Please check your .env files.")
    
    return api_key

# Load and export the API key
MISTRAL_API_KEY = load_env_variables() 