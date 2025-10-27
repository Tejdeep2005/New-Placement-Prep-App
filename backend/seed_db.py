import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["placement_prep_db"]
    
    # Create admin user
    admin_hash = pwd_context.hash("admin123")
    admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@prep.com",
        "name": "Admin User",
        "role": "admin",
        "password_hash": admin_hash,
        "level": 10,
        "points": 5000,
        "badges": ["Admin"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Create student user
    student_hash = pwd_context.hash("student123")
    student = {
        "id": str(uuid.uuid4()),
        "email": "student@prep.com",
        "name": "Test Student",
        "role": "student",
        "password_hash": student_hash,
        "level": 5,
        "points": 1200,
        "badges": ["Beginner", "Problem Solver"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert users
    await db.users.insert_many([admin, student])
    
    # Create sample quiz
    quiz = {
        "id": str(uuid.uuid4()),
        "title": "Data Structures Fundamentals",
        "description": "Test your knowledge of arrays, linked lists, and trees",
        "questions": [
            {
                "id": "q1",
                "question": "What is the time complexity of accessing an element in an array by index?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                "correct_answer": "O(1)"
            },
            {
                "id": "q2",
                "question": "Which data structure follows LIFO principle?",
                "options": ["Queue", "Stack", "Array", "Tree"],
                "correct_answer": "Stack"
            },
            {
                "id": "q3",
                "question": "What is the worst case time complexity of binary search?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
                "correct_answer": "O(log n)"
            }
        ],
        "difficulty": "medium",
        "category": "data-structures",
        "company": "Google",
        "time_limit": 15,
        "points": 100,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.quizzes.insert_one(quiz)
    
    # Create sample challenge
    challenge = {
        "id": str(uuid.uuid4()),
        "title": "Two Sum Problem",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] = 9",
        "test_cases": [
            {"input": {"nums": [2, 7, 11, 15], "target": 9}, "output": [0, 1]},
            {"input": {"nums": [3, 2, 4], "target": 6}, "output": [1, 2]},
            {"input": {"nums": [3, 3], "target": 6}, "output": [0, 1]}
        ],
        "difficulty": "easy",
        "company": "Amazon",
        "language_support": ["Python", "JavaScript", "Java"],
        "points": 150,
        "starter_code": {
            "python": "def two_sum(nums, target):\n    # Write your code here\n    pass",
            "javascript": "function twoSum(nums, target) {\n    // Write your code here\n}",
            "java": "public int[] twoSum(int[] nums, int target) {\n    // Write your code here\n}"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.challenges.insert_one(challenge)
    
    # Create more sample quizzes
    quiz2 = {
        "id": str(uuid.uuid4()),
        "title": "Algorithm Complexity",
        "description": "Master Big O notation and time complexity analysis",
        "questions": [
            {
                "id": "q1",
                "question": "What is the time complexity of bubble sort?",
                "options": ["O(n)", "O(n^2)", "O(log n)", "O(n log n)"],
                "correct_answer": "O(n^2)"
            },
            {
                "id": "q2",
                "question": "Which sorting algorithm has best average case complexity?",
                "options": ["Bubble Sort", "Merge Sort", "Selection Sort", "Insertion Sort"],
                "correct_answer": "Merge Sort"
            }
        ],
        "difficulty": "easy",
        "category": "algorithms",
        "company": "Microsoft",
        "time_limit": 10,
        "points": 80,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.quizzes.insert_one(quiz2)
    
    # Create more sample challenges
    challenge2 = {
        "id": str(uuid.uuid4()),
        "title": "Reverse Linked List",
        "description": "Given the head of a singly linked list, reverse the list and return the reversed list.\n\nExample:\nInput: 1 -> 2 -> 3 -> 4 -> 5\nOutput: 5 -> 4 -> 3 -> 2 -> 1",
        "test_cases": [
            {"input": {"head": [1, 2, 3, 4, 5]}, "output": [5, 4, 3, 2, 1]},
            {"input": {"head": [1, 2]}, "output": [2, 1]},
            {"input": {"head": []}, "output": []}
        ],
        "difficulty": "medium",
        "company": "Google",
        "language_support": ["Python", "JavaScript", "Java", "C++"],
        "points": 200,
        "starter_code": {
            "python": "def reverse_list(head):\n    # Write your code here\n    pass",
            "javascript": "function reverseList(head) {\n    // Write your code here\n}",
            "java": "public ListNode reverseList(ListNode head) {\n    // Write your code here\n}"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.challenges.insert_one(challenge2)
    
    print("✅ Database seeded successfully!")
    print(f"Admin login: admin@prep.com / admin123")
    print(f"Student login: student@prep.com / student123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
