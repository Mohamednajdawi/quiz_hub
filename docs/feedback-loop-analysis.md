# Feedback Loop Analysis & Improvement Recommendations

## Current Implementation Overview

### How It Works Now

1. **Feedback Generation** (`backend/utils/feedback.py`)
   - After quiz/essay attempts, AI generates structured feedback
   - Identifies weak topics (top 3 most missed)
   - Recommends adaptive difficulty
   - Creates study plan with flashcards/quizzes focus

2. **Feedback Storage** (`backend/database/sqlite_dal.py`)
   - `QuizAttempt.ai_feedback` - Text field storing AI-generated feedback
   - `EssayAnswer.ai_feedback` - Similar for essays
   - `question_performance` - JSON field with per-question details

3. **Feedback Collection** (`backend/utils/feedback_context.py`)
   - `collect_feedback_context()` aggregates recent feedback
   - Default: Last 4 entries, max 1500 characters
   - Scoped to quiz_topic_ids or essay_topic_ids if provided
   - Falls back to all user feedback if scoped search returns nothing

4. **Feedback Usage** (`backend/generation/*_template.py`)
   - Feedback passed to generation prompts
   - Templates have conditional sections: `{% if feedback %}...{% endif %}`
   - Used for quizzes, flashcards, essays, mind maps

### Current Flow Diagram

```
User Takes Quiz
    ↓
QuizAttempt Recorded (with question_performance)
    ↓
AI Feedback Generated (weak topics, difficulty recommendation)
    ↓
Feedback Stored in ai_feedback field
    ↓
[Later] User Generates New Content
    ↓
collect_feedback_context() → Last 4 feedback entries (1500 chars)
    ↓
Feedback Passed to Generation Prompt
    ↓
New Content Targets Weak Areas
```

## Current Limitations

### 1. **Limited Context Window**
- Only last 4 feedback entries
- Max 1500 characters
- **Problem**: Important patterns from earlier attempts may be lost
- **Impact**: System "forgets" long-term weaknesses

### 2. **No Structured Topic Extraction**
- Feedback is just concatenated text
- No extraction of specific weak topics/concepts
- **Problem**: LLM must parse unstructured text to find weak areas
- **Impact**: Less precise targeting, potential information loss

### 3. **No Frequency/Priority Weighting**
- All feedback entries treated equally
- No consideration of how often a topic is missed
- **Problem**: One-off mistakes weighted same as persistent weaknesses
- **Impact**: Less effective prioritization

### 4. **No Temporal Decay**
- Old feedback (weeks ago) treated same as recent
- No consideration of improvement over time
- **Problem**: System doesn't recognize when weaknesses are resolved
- **Impact**: May keep targeting topics user has already mastered

### 5. **No Cross-Content-Type Learning**
- Quiz mistakes → Quiz generation (good)
- Quiz mistakes → Flashcard generation (good)
- But no structured mapping between content types
- **Problem**: Can't leverage essay mistakes to improve quiz generation
- **Impact**: Missed opportunities for cross-pollination

### 6. **No Mastery Tracking**
- No confidence scores per topic
- No tracking of improvement trajectory
- **Problem**: Can't identify when user has mastered a topic
- **Impact**: May over-target mastered topics, under-target new weaknesses

### 7. **Limited Scope Intelligence**
- Scoped to topic_ids if provided, but fallback is all feedback
- No project-level or subject-level aggregation
- **Problem**: May mix unrelated feedback (e.g., biology + history)
- **Impact**: Less relevant targeting

### 8. **No Structured Weak Topic Database**
- Weak topics extracted per attempt but not persisted
- No cumulative weak topic tracking
- **Problem**: Can't build a persistent knowledge graph of weaknesses
- **Impact**: Must re-extract from feedback text each time

## Improvement Recommendations

### Priority 1: Structured Weak Topic Tracking

**Create a new table: `user_weak_topics`**

```python
class UserWeakTopic(Base):
    __tablename__ = "user_weak_topics"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    topic_name = Column(String, nullable=False)  # e.g., "Photosynthesis", "French Revolution"
    topic_category = Column(String, nullable=True)  # e.g., "Biology", "History"
    
    # Frequency tracking
    miss_count = Column(Integer, default=0)  # Total times missed
    attempt_count = Column(Integer, default=0)  # Total times encountered
    
    # Temporal tracking
    first_missed_at = Column(DateTime, nullable=True)
    last_missed_at = Column(DateTime, nullable=True)
    last_attempted_at = Column(DateTime, nullable=True)
    
    # Mastery tracking
    mastery_score = Column(Float, default=0.0)  # 0.0 = weak, 1.0 = mastered
    improvement_trend = Column(String, nullable=True)  # "improving", "declining", "stable"
    
    # Context
    source_type = Column(String, nullable=True)  # "quiz", "essay", "flashcard"
    project_id = Column(Integer, ForeignKey("student_projects.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
```

**Benefits:**
- Persistent tracking of weak topics across all attempts
- Can calculate mastery scores and improvement trends
- Enables smarter prioritization

### Priority 2: Enhanced Feedback Collection

**Improve `collect_feedback_context()` to use structured data:**

```python
def collect_feedback_context_enhanced(
    db: Session,
    *,
    user_id: str,
    project_id: Optional[int] = None,
    max_topics: int = 5,
    min_miss_count: int = 2,  # Only include topics missed 2+ times
    recency_days: int = 30,  # Only consider recent attempts
) -> Optional[str]:
    """
    Collect weak topics from structured database instead of parsing feedback text.
    """
    query = db.query(UserWeakTopic).filter(
        UserWeakTopic.user_id == user_id,
        UserWeakTopic.mastery_score < 0.7,  # Only weak topics
        UserWeakTopic.last_missed_at >= datetime.now() - timedelta(days=recency_days),
    )
    
    if project_id:
        query = query.filter(UserWeakTopic.project_id == project_id)
    
    weak_topics = query.order_by(
        UserWeakTopic.miss_count.desc(),  # Most frequently missed first
        UserWeakTopic.last_missed_at.desc()  # Most recent second
    ).limit(max_topics).all()
    
    if not weak_topics:
        return None
    
    # Format structured feedback
    feedback_lines = ["LEARNER WEAKNESSES TO TARGET:"]
    for topic in weak_topics:
        mastery_pct = int(topic.mastery_score * 100)
        feedback_lines.append(
            f"- {topic.topic_name} ({topic.topic_category or 'General'}) | "
            f"Missed {topic.miss_count} times | Mastery: {mastery_pct}% | "
            f"Last missed: {topic.last_missed_at.strftime('%Y-%m-%d')}"
        )
    
    return "\n".join(feedback_lines)
```

**Benefits:**
- More accurate topic extraction
- Prioritization by frequency and recency
- Excludes mastered topics automatically

### Priority 3: Mastery Score Calculation

**Implement mastery tracking:**

```python
def update_mastery_score(
    db: Session,
    user_id: str,
    topic_name: str,
    was_correct: bool,
    difficulty: str,
) -> None:
    """
    Update mastery score based on attempt result.
    Uses exponential moving average for smooth updates.
    """
    weak_topic = db.query(UserWeakTopic).filter(
        UserWeakTopic.user_id == user_id,
        UserWeakTopic.topic_name == topic_name,
    ).first()
    
    if not weak_topic:
        # Create new entry
        weak_topic = UserWeakTopic(
            user_id=user_id,
            topic_name=topic_name,
            miss_count=0 if was_correct else 1,
            attempt_count=1,
            first_missed_at=datetime.now() if not was_correct else None,
            last_missed_at=datetime.now() if not was_correct else None,
            last_attempted_at=datetime.now(),
            mastery_score=1.0 if was_correct else 0.0,
        )
        db.add(weak_topic)
    else:
        # Update existing
        weak_topic.attempt_count += 1
        weak_topic.last_attempted_at = datetime.now()
        
        if not was_correct:
            weak_topic.miss_count += 1
            weak_topic.last_missed_at = datetime.now()
            if not weak_topic.first_missed_at:
                weak_topic.first_missed_at = datetime.now()
        
        # Calculate mastery: exponential moving average
        # Recent performance weighted more heavily
        alpha = 0.3  # Smoothing factor
        current_performance = 1.0 if was_correct else 0.0
        
        # Weight by difficulty
        difficulty_weight = {"easy": 0.8, "medium": 1.0, "hard": 1.2}[difficulty]
        weighted_performance = current_performance * difficulty_weight
        
        weak_topic.mastery_score = (
            alpha * weighted_performance + 
            (1 - alpha) * weak_topic.mastery_score
        )
        
        # Clamp to [0, 1]
        weak_topic.mastery_score = max(0.0, min(1.0, weak_topic.mastery_score))
        
        # Calculate improvement trend
        # (Compare recent attempts vs older attempts)
        # Implementation details...
    
    db.commit()
```

**Benefits:**
- Continuous mastery tracking
- Recognizes improvement over time
- Automatically excludes mastered topics from feedback

### Priority 4: Cross-Content-Type Learning

**Extract topics from all content types:**

```python
def extract_topics_from_attempt(
    db: Session,
    attempt: Union[QuizAttempt, EssayAnswer],
    content_type: str,
) -> List[Dict[str, Any]]:
    """
    Extract weak topics from any attempt type and update UserWeakTopic.
    """
    topics = []
    
    if content_type == "quiz":
        # Extract from question_performance
        question_perf = attempt.question_performance or []
        for q in question_perf:
            if not q.get("is_correct", False):
                topic_name = q.get("concept") or q.get("topic") or "Unknown"
                topics.append({
                    "name": topic_name,
                    "category": attempt.topic.category if hasattr(attempt, "topic") else None,
                })
    elif content_type == "essay":
        # Extract from essay feedback or question text
        # Similar logic...
    
    # Update UserWeakTopic for each extracted topic
    for topic in topics:
        update_mastery_score(
            db,
            user_id=attempt.user_id,
            topic_name=topic["name"],
            was_correct=False,  # Since we're extracting from incorrect answers
            difficulty=attempt.difficulty_level or "medium",
        )
    
    return topics
```

**Benefits:**
- Unified weak topic tracking across all content types
- Quiz mistakes inform flashcard generation
- Essay mistakes inform quiz generation

### Priority 5: Temporal Decay & Recency Weighting

**Weight feedback by recency:**

```python
def calculate_feedback_weight(
    last_missed_at: datetime,
    recency_days: int = 30,
) -> float:
    """
    Calculate weight for feedback based on recency.
    Recent feedback weighted more heavily.
    """
    days_ago = (datetime.now() - last_missed_at).days
    
    if days_ago > recency_days:
        return 0.0  # Too old, ignore
    
    # Exponential decay: weight = e^(-days_ago / half_life)
    half_life = recency_days / 2  # Half weight after half the period
    weight = math.exp(-days_ago / half_life)
    
    return weight
```

**Benefits:**
- Recent weaknesses prioritized
- Old weaknesses fade out naturally
- System adapts to user improvement

### Priority 6: Project/Subject-Level Scoping

**Improve scoping logic:**

```python
def collect_feedback_context_scoped(
    db: Session,
    *,
    user_id: str,
    project_id: Optional[int] = None,
    subject_category: Optional[str] = None,  # e.g., "Biology", "History"
) -> Optional[str]:
    """
    Collect feedback scoped to project or subject category.
    """
    query = db.query(UserWeakTopic).filter(
        UserWeakTopic.user_id == user_id,
        UserWeakTopic.mastery_score < 0.7,
    )
    
    if project_id:
        query = query.filter(UserWeakTopic.project_id == project_id)
    
    if subject_category:
        query = query.filter(UserWeakTopic.topic_category == subject_category)
    
    # If no scoped results, try broader scope
    if query.count() == 0:
        query = db.query(UserWeakTopic).filter(
            UserWeakTopic.user_id == user_id,
            UserWeakTopic.mastery_score < 0.7,
        )
    
    # Rest of logic...
```

**Benefits:**
- More relevant feedback for specific projects/subjects
- Avoids mixing unrelated topics
- Better targeting

### Priority 7: Feedback Quality Improvements

**Enhance feedback generation to extract structured topics:**

```python
def generate_quiz_feedback_enhanced(
    *,
    topic_name: str,
    score: int,
    total_questions: int,
    percentage: float,
    question_details: Iterable[dict],
    db: Session,
    user_id: str,
) -> Tuple[Optional[str], List[Dict[str, str]]]:
    """
    Generate feedback AND extract structured weak topics for database.
    """
    # Existing feedback generation logic...
    ai_feedback = generate_quiz_feedback(...)
    
    # Extract structured topics
    weak_topics = []
    for detail in question_details:
        if not detail.get("is_correct", False):
            weak_topics.append({
                "name": detail.get("concept") or detail.get("topic") or "Unknown",
                "category": topic_name,  # Or extract from question
            })
    
    # Update UserWeakTopic database
    for topic in weak_topics:
        update_mastery_score(db, user_id, topic["name"], was_correct=False, ...)
    
    return ai_feedback, weak_topics
```

**Benefits:**
- Structured data extraction at feedback time
- No need to parse text later
- More accurate topic identification

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Create `user_weak_topics` table migration
2. Implement `update_mastery_score()` function
3. Update feedback generation to extract topics
4. Update attempt recording to call `update_mastery_score()`

### Phase 2: Enhanced Collection (Week 3)
1. Implement `collect_feedback_context_enhanced()`
2. Add temporal decay weighting
3. Add project/subject scoping
4. Update all generation endpoints to use enhanced collection

### Phase 3: Cross-Content Learning (Week 4)
1. Extract topics from essays
2. Extract topics from flashcard performance
3. Unified topic tracking across all content types

### Phase 4: Analytics & UI (Week 5)
1. Add weak topics dashboard
2. Show mastery scores per topic
3. Visualize improvement trends
4. Allow users to manually mark topics as mastered

## Expected Impact

### Before Improvements
- Limited to last 4 feedback entries
- Unstructured text parsing
- No mastery tracking
- May target already-mastered topics
- No cross-content learning

### After Improvements
- Persistent weak topic database
- Structured topic extraction
- Mastery scores and improvement tracking
- Automatically excludes mastered topics
- Cross-content learning (quiz → flashcard → essay)
- Temporal decay (recent weaknesses prioritized)
- Project/subject scoping

### Metrics to Track
- **Targeting Accuracy**: % of generated questions targeting actual weak topics
- **Mastery Recognition**: % of mastered topics correctly excluded
- **Improvement Rate**: Average improvement in weak topic mastery scores
- **User Engagement**: Increase in content generation after improvements

## Conclusion

The current feedback loop is functional but has significant limitations. The proposed improvements will:

1. **Make feedback more accurate** through structured topic extraction
2. **Make feedback more relevant** through temporal decay and scoping
3. **Make feedback more intelligent** through mastery tracking
4. **Make feedback more comprehensive** through cross-content learning

These improvements will transform the feedback loop from a simple "last 4 entries" system into an intelligent, adaptive learning system that truly personalizes content generation.

