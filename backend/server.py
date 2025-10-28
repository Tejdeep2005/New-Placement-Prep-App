import os
import logging
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
import bcrypt

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB setup
mongo_url = os.getenv('MONGO_URL', 'mongodb+srv://tejkonda_db_user:1lLTtftx3f1qBl5R@cluster0.hl0lsgv.mongodb.net/?appName=Cluster0')
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv('DB_NAME', 'placement_prep_db')]

# Security setup
security = HTTPBearer()
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await client.admin.command('ping')
        logger.info("✅ Successfully connected to MongoDB")
        
        # Create indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        logger.info("✅ Database indexes created")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
        raise e
    
    yield
    
    # Shutdown
    client.close()
    logger.info("Database connection closed")

app = FastAPI(title="Placement Prep API", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Pydantic models
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserRegister(UserBase):
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: str
    role: str
    level: int = 1
    points: int = 0
    badges: List[str] = []
    created_at: str
    password_hash: str

class UserResponse(UserBase):
    id: str
    role: str
    level: int
    points: int
    badges: List[str]
    created_at: str

# Helper functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def sanitize_user(user: dict) -> dict:
    """Remove password_hash from user dict"""
    user_copy = user.copy()
    user_copy.pop('password_hash', None)
    user_copy.pop('_id', None)
    return user_copy

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    try:
        logger.info(f"Registration attempt for email: {user_data.email}")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            logger.warning(f"Email already registered: {user_data.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user document
        user_id = str(uuid.uuid4())
        user_dict = {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": user_data.role,
            "password_hash": hash_password(user_data.password),
            "level": 1,
            "points": 0,
            "badges": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert into database
        result = await db.users.insert_one(user_dict)
        logger.info(f"User created successfully with id: {user_id}")
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        # Return response
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": sanitize_user(user_dict)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    try:
        logger.info(f"Login attempt for email: {user_data.email}")
        
        # Find user
        user = await db.users.find_one({"email": user_data.email})
        if not user:
            logger.warning(f"User not found: {user_data.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        logger.info(f"User found: {user_data.email}, checking password...")
        
        # Verify password
        try:
            if not verify_password(user_data.password, user["password_hash"]):
                logger.warning(f"Invalid password for user: {user_data.email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
        except Exception as pwd_error:
            logger.error(f"Password verification error: {pwd_error}")
            raise HTTPException(status_code=500, detail="Password verification failed")
        
        logger.info(f"User logged in successfully: {user_data.email}")
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        # Return response
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": sanitize_user(user)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return sanitize_user(current_user)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await client.admin.command('ping')
        user_count = await db.users.count_documents({})
        return {
            "status": "healthy",
            "database": "connected",
            "users": user_count
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Add CORS middleware - MUST be before route includes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Placement Prep API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)