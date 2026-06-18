import sys
from pathlib import Path

# Add backend directory to Python path so imports work
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.app import app

if __name__ == "__main__":
    app.run()

