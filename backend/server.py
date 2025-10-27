from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Cookie, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import requests
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.environ['JWT_SECRET']
ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, battle_id: str, websocket: WebSocket):
        await websocket.accept()
        if battle_id not in self.active_connections:
            self.active_connections[battle_id] = []
        self.active_connections[battle_id].append(websocket)

    def disconnect(self, battle_id: str, websocket: WebSocket):
        if battle_id in self.active_connections:
            self.active_connections[battle_id].remove(websocket)

    async def broadcast(self, battle_id: str, message: dict):
        if battle_id in self.active_connections:
            for connection in self.active_connections[battle_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str  # "student" or "admin"
    password_hash: Optional[str] = None
    google_id: Optional[str] = None
    profile_pic: Optional[str] = None
    level: int = 1
    points: int = 0
    badges: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: str
    name: str
    password: str
    role: str = "student"

class UserLogin(BaseModel):
    email: str
    password: str

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_token: str
    user_id: str
    expires_at: datetime

class Quiz(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    questions: List[Dict[str, Any]]
    difficulty: str
    category: str
    company: Optional[str] = None
    time_limit: int  # in minutes
    points: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizCreate(BaseModel):
    title: str
    description: str
    questions: List[Dict[str, Any]]
    difficulty: str
    category: str
    company: Optional[str] = None
    time_limit: int
    points: int

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: Dict[str, Any]
    time_taken: int

class Challenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    test_cases: List[Dict[str, Any]]
    difficulty: str
    company: str
    language_support: List[str]
    points: int
    starter_code: Dict[str, str]  # language: code
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChallengeCreate(BaseModel):
    title: str
    description: str
    test_cases: List[Dict[str, Any]]
    difficulty: str
    company: str
    language_support: List[str]
    points: int
    starter_code: Dict[str, str]

class CodeSubmission(BaseModel):
    challenge_id: str
    code: str
    language: str

class MockInterviewMessage(BaseModel):
    role: str
    content: str

class MockInterviewCreate(BaseModel):
    message: str

class FriendRequest(BaseModel):
    friend_email: str

class CodingBattle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    challenge_id: str
    players: List[Dict[str, Any]]
    status: str  # "waiting", "active", "completed"
    winner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(response: Response, authorization: Optional[HTTPAuthorizationCredentials] = Depends(security), session_token: Optional[str] = Cookie(None)):
    token = None
    if session_token:
        token = session_token
    elif authorization:
        token = authorization.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        password_hash=hash_password(user_data.password)
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user.model_dump(exclude={"password_hash"})}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user['id']})
    return {"access_token": access_token, "token_type": "bearer", "user": {k: v for k, v in user.items() if k != "password_hash"}}

@api_router.get("/auth/google-login")
async def google_login_url():
    redirect_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + "/dashboard"
    auth_url = f"https://auth.emergentagent.com/?redirect={redirect_url}"
    return {"url": auth_url}

@api_router.post("/auth/google-session")
async def google_session(session_id: str, response: Response):
    try:
        headers = {"X-Session-ID": session_id}
        resp = requests.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", headers=headers)
        resp.raise_for_status()
        session_data = resp.json()
        
        user = await db.users.find_one({"email": session_data['email']}, {"_id": 0})
        
        if not user:
            new_user = User(
                email=session_data['email'],
                name=session_data['name'],
                role="student",
                google_id=session_data['id'],
                profile_pic=session_data.get('picture')
            )
            doc = new_user.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.users.insert_one(doc)
            user = doc
        
        access_token = create_access_token(data={"sub": user['id']})
        
        session = Session(
            session_token=access_token,
            user_id=user['id'],
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        session_doc = session.model_dump()
        session_doc['expires_at'] = session_doc['expires_at'].isoformat()
        await db.sessions.insert_one(session_doc)
        
        response.set_cookie(
            key="session_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        return {"access_token": access_token, "user": {k: v for k, v in user.items() if k != "password_hash"}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    await db.sessions.delete_many({"user_id": current_user.id})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user.model_dump(exclude={"password_hash"})

# Quiz endpoints
@api_router.post("/quizzes", dependencies=[Depends(get_admin_user)])
async def create_quiz(quiz_data: QuizCreate):
    quiz = Quiz(**quiz_data.model_dump())
    doc = quiz.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.quizzes.insert_one(doc)
    return quiz

@api_router.get("/quizzes")
async def get_quizzes(category: Optional[str] = None, company: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if category:
        query['category'] = category
    if company:
        query['company'] = company
    quizzes = await db.quizzes.find(query, {"_id": 0}).to_list(1000)
    return quizzes

@api_router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@api_router.post("/quizzes/submit")
async def submit_quiz(submission: QuizSubmission, current_user: User = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"id": submission.quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    score = 0
    total_questions = len(quiz['questions'])
    
    for question in quiz['questions']:
        question_id = question['id']
        if question_id in submission.answers:
            if submission.answers[question_id] == question['correct_answer']:
                score += 1
    
    points_earned = int((score / total_questions) * quiz['points'])
    
    result = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "quiz_id": submission.quiz_id,
        "score": score,
        "total_questions": total_questions,
        "time_taken": submission.time_taken,
        "points_earned": points_earned,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.quiz_results.insert_one(result)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"points": points_earned}}
    )
    
    return result

@api_router.delete("/quizzes/{quiz_id}", dependencies=[Depends(get_admin_user)])
async def delete_quiz(quiz_id: str):
    result = await db.quizzes.delete_one({"id": quiz_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"message": "Quiz deleted successfully"}

# Challenge endpoints
@api_router.post("/challenges", dependencies=[Depends(get_admin_user)])
async def create_challenge(challenge_data: ChallengeCreate):
    challenge = Challenge(**challenge_data.model_dump())
    doc = challenge.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.challenges.insert_one(doc)
    return challenge

@api_router.get("/challenges")
async def get_challenges(company: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if company:
        query['company'] = company
    challenges = await db.challenges.find(query, {"_id": 0}).to_list(1000)
    return challenges

@api_router.get("/challenges/{challenge_id}")
async def get_challenge(challenge_id: str, current_user: User = Depends(get_current_user)):
    challenge = await db.challenges.find_one({"id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@api_router.post("/challenges/submit")
async def submit_challenge(submission: CodeSubmission, current_user: User = Depends(get_current_user)):
    challenge = await db.challenges.find_one({"id": submission.challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # Simple code execution simulation - in production, use Judge0 API or similar
    passed_tests = 0
    total_tests = len(challenge['test_cases'])
    
    # Simulate test execution
    passed_tests = total_tests  # For demo purposes
    
    points_earned = challenge['points'] if passed_tests == total_tests else 0
    
    result = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "challenge_id": submission.challenge_id,
        "code": submission.code,
        "language": submission.language,
        "status": "Accepted" if passed_tests == total_tests else "Failed",
        "passed_tests": passed_tests,
        "total_tests": total_tests,
        "points_earned": points_earned,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.challenge_results.insert_one(result)
    
    if points_earned > 0:
        await db.users.update_one(
            {"id": current_user.id},
            {"$inc": {"points": points_earned}}
        )
    
    return result

@api_router.delete("/challenges/{challenge_id}", dependencies=[Depends(get_admin_user)])
async def delete_challenge(challenge_id: str):
    result = await db.challenges.delete_one({"id": challenge_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"message": "Challenge deleted successfully"}

# Mock Interview endpoints
@api_router.post("/mock-interview/start")
async def start_mock_interview(current_user: User = Depends(get_current_user)):
    interview_id = str(uuid.uuid4())
    interview = {
        "id": interview_id,
        "user_id": current_user.id,
        "messages": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.mock_interviews.insert_one(interview)
    return {"interview_id": interview_id, "message": "Hello! I'm your AI interviewer. Let's begin with a brief introduction about yourself."}

@api_router.post("/mock-interview/{interview_id}/message")
async def send_interview_message(interview_id: str, message_data: MockInterviewCreate, current_user: User = Depends(get_current_user)):
    interview = await db.mock_interviews.find_one({"id": interview_id, "user_id": current_user.id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=interview_id,
            system_message="You are an experienced technical interviewer conducting a placement preparation interview. Ask relevant questions about data structures, algorithms, system design, and behavioral questions. Provide constructive feedback."
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        
        user_message = UserMessage(text=message_data.message)
        response = await chat.send_message(user_message)
        
        messages = interview.get('messages', [])
        messages.append({"role": "user", "content": message_data.message})
        messages.append({"role": "assistant", "content": response})
        
        await db.mock_interviews.update_one(
            {"id": interview_id},
            {"$set": {"messages": messages}}
        )
        
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview error: {str(e)}")

@api_router.get("/mock-interview/{interview_id}")
async def get_interview(interview_id: str, current_user: User = Depends(get_current_user)):
    interview = await db.mock_interviews.find_one({"id": interview_id, "user_id": current_user.id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@api_router.get("/mock-interview")
async def get_my_interviews(current_user: User = Depends(get_current_user)):
    interviews = await db.mock_interviews.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    return interviews

# Friends endpoints
@api_router.post("/friends/request")
async def send_friend_request(friend_data: FriendRequest, current_user: User = Depends(get_current_user)):
    friend = await db.users.find_one({"email": friend_data.friend_email}, {"_id": 0})
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend['id'] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    existing = await db.friends.find_one({
        "$or": [
            {"user_id": current_user.id, "friend_id": friend['id']},
            {"user_id": friend['id'], "friend_id": current_user.id}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")
    
    friendship = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "friend_id": friend['id'],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friends.insert_one(friendship)
    return {"message": "Friend request sent"}

@api_router.get("/friends")
async def get_friends(current_user: User = Depends(get_current_user)):
    friendships = await db.friends.find({
        "$or": [{"user_id": current_user.id}, {"friend_id": current_user.id}],
        "status": "accepted"
    }, {"_id": 0}).to_list(1000)
    
    friend_ids = []
    for f in friendships:
        if f['user_id'] == current_user.id:
            friend_ids.append(f['friend_id'])
        else:
            friend_ids.append(f['user_id'])
    
    friends = await db.users.find({"id": {"$in": friend_ids}}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return friends

@api_router.post("/friends/{friendship_id}/accept")
async def accept_friend_request(friendship_id: str, current_user: User = Depends(get_current_user)):
    friendship = await db.friends.find_one({"id": friendship_id, "friend_id": current_user.id})
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    await db.friends.update_one({"id": friendship_id}, {"$set": {"status": "accepted"}})
    return {"message": "Friend request accepted"}

@api_router.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, current_user: User = Depends(get_current_user)):
    result = await db.friends.delete_one({
        "$or": [
            {"user_id": current_user.id, "friend_id": friend_id},
            {"user_id": friend_id, "friend_id": current_user.id}
        ]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed"}

# Leaderboard
@api_router.get("/leaderboard")
async def get_leaderboard(current_user: User = Depends(get_current_user)):
    users = await db.users.find(
        {"role": "student"},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "points": 1, "level": 1, "profile_pic": 1}
    ).sort("points", -1).limit(100).to_list(100)
    
    return [{**user, "rank": idx + 1} for idx, user in enumerate(users)]

# Admin endpoints
@api_router.get("/admin/users", dependencies=[Depends(get_admin_user)])
async def get_all_users():
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/stats", dependencies=[Depends(get_admin_user)])
async def get_stats():
    total_users = await db.users.count_documents({"role": "student"})
    total_quizzes = await db.quizzes.count_documents({})
    total_challenges = await db.challenges.count_documents({})
    total_quiz_attempts = await db.quiz_results.count_documents({})
    total_challenge_attempts = await db.challenge_results.count_documents({})
    
    return {
        "total_users": total_users,
        "total_quizzes": total_quizzes,
        "total_challenges": total_challenges,
        "total_quiz_attempts": total_quiz_attempts,
        "total_challenge_attempts": total_challenge_attempts
    }

# WebSocket endpoint for live coding battles
@app.websocket("/ws/battle/{battle_id}")
async def websocket_battle(websocket: WebSocket, battle_id: str):
    await manager.connect(battle_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(battle_id, data)
    except WebSocketDisconnect:
        manager.disconnect(battle_id, websocket)

# Coding battle endpoints
@api_router.post("/battles/create")
async def create_battle(challenge_id: str, current_user: User = Depends(get_current_user)):
    battle = CodingBattle(
        challenge_id=challenge_id,
        players=[{"user_id": current_user.id, "name": current_user.name, "status": "waiting"}],
        status="waiting"
    )
    
    doc = battle.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.battles.insert_one(doc)
    
    return battle

@api_router.post("/battles/{battle_id}/join")
async def join_battle(battle_id: str, current_user: User = Depends(get_current_user)):
    battle = await db.battles.find_one({"id": battle_id}, {"_id": 0})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    if battle['status'] != "waiting":
        raise HTTPException(status_code=400, detail="Battle already started")
    
    players = battle['players']
    players.append({"user_id": current_user.id, "name": current_user.name, "status": "ready"})
    
    await db.battles.update_one(
        {"id": battle_id},
        {"$set": {"players": players, "status": "active" if len(players) >= 2 else "waiting"}}
    )
    
    return {"message": "Joined battle"}

@api_router.get("/battles/{battle_id}")
async def get_battle(battle_id: str, current_user: User = Depends(get_current_user)):
    battle = await db.battles.find_one({"id": battle_id}, {"_id": 0})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    return battle

@api_router.get("/battles")
async def get_battles(current_user: User = Depends(get_current_user)):
    battles = await db.battles.find({"status": "waiting"}, {"_id": 0}).to_list(100)
    return battles

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()