import os
import sys
import json
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path so we can import from the backend package
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database.sqlite_dal import Base, QuizTopic, QuizQuestion, FlashcardTopic, FlashcardCard, EssayQATopic, EssayQAQuestion

# Get the absolute path of the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "quiz_database.db")
print(f"Database path: {db_path}")

# Create SQLite engine with absolute path
engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

# Create all tables
Base.metadata.create_all(engine)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a session
db = SessionLocal()

try:
    # Check if EssayQA tables have any data
    Essay_qa_topics = db.query(EssayQATopic).all()
    
    if len(Essay_qa_topics) == 0:
        print("No EssayQA topics found, creating sample data...")
        
        # Create sample EssayQA topics and questions
        sample_topics = [
            {
                "topic": "CRISPR-Cas9 Gene Editing",
                "category": "Molecular Biology",
                "subcategory": "Genetic Engineering",
                "questions": [
                    {
                        "question": "What is the basic mechanism of CRISPR-Cas9 gene editing?",
                        "full_answer": "CRISPR-Cas9 is a genome editing tool that uses a guide RNA (gRNA) to target a specific DNA sequence and the Cas9 enzyme to cut the DNA at that location. This creates a double-strand break that the cell then repairs, either by non-homologous end joining (which can introduce mutations) or by homology-directed repair (which can introduce specific changes if a repair template is provided).",
                        "key_info": ["Uses guide RNA to target specific DNA sequences", "Cas9 enzyme cuts DNA at target site", "Creates double-strand breaks", "Cell repairs breaks through NHEJ or HDR"]
                    },
                    {
                        "question": "What are the main advantages of CRISPR over earlier gene editing technologies?",
                        "full_answer": "CRISPR has several advantages over earlier gene editing technologies like zinc finger nucleases (ZFNs) and TALENs. It is simpler to design and implement, more cost-effective, can target multiple genes simultaneously (multiplexing), has higher efficiency, and offers greater precision. The targeting mechanism relies on RNA-DNA base pairing rather than protein-DNA interactions, making it easier to program for different targets.",
                        "key_info": ["Simpler to design and use", "More cost-effective", "Allows multiplexing", "Higher efficiency and precision", "RNA-DNA targeting is easier than protein-DNA"]
                    },
                    {
                        "question": "What ethical concerns are associated with CRISPR technology?",
                        "full_answer": "CRISPR technology raises several ethical concerns, especially regarding human germline editing. These include: potential for unintended off-target effects and mosaicism; creation of designer babies and eugenics concerns; questions about consent for future generations; exacerbation of social inequality if access is limited; dual-use concerns for bioweapons; and ecological impacts from gene drives. There are also concerns about patenting and commercialization of the technology.",
                        "key_info": ["Unintended genetic effects", "Designer babies and eugenics", "Consent for future generations", "Social inequality in access", "Potential misuse as bioweapons", "Ecological impacts of gene drives"]
                    }
                ]
            },
            {
                "topic": "Cardiovascular Physiology",
                "category": "Human Physiology",
                "subcategory": "Circulatory System",
                "questions": [
                    {
                        "question": "Explain the cardiac cycle and the events occurring during systole and diastole.",
                        "full_answer": "The cardiac cycle is the sequence of events that occurs during one heartbeat. It consists of two main phases: systole (contraction) and diastole (relaxation). During atrial systole, the atria contract, pushing blood into the ventricles. This is followed by ventricular systole, where the ventricles contract, ejecting blood into the pulmonary artery and aorta. During diastole, all chambers relax and refill with blood. The cycle is regulated by electrical signals from the sinoatrial node and is accompanied by changes in pressure and volume in the heart chambers, and the opening and closing of heart valves.",
                        "key_info": ["Consists of systole (contraction) and diastole (relaxation)", "Atrial systole pushes blood into ventricles", "Ventricular systole ejects blood into arteries", "During diastole, chambers relax and refill", "Regulated by SA node electrical signals", "Involves pressure/volume changes and valve movements"]
                    },
                    {
                        "question": "Describe the mechanisms controlling blood pressure and how hypertension develops.",
                        "full_answer": "Blood pressure is controlled by several mechanisms: cardiac output (determined by heart rate and stroke volume), peripheral resistance (controlled by vasoconstriction/vasodilation), blood volume (regulated by kidneys), and blood viscosity. Short-term regulation involves the autonomic nervous system (baroreceptor reflex) and hormones like epinephrine. Long-term regulation primarily involves the renin-angiotensin-aldosterone system and antidiuretic hormone. Hypertension develops when these regulatory mechanisms are disrupted, commonly due to: increased sympathetic activity, dysfunction in the renin-angiotensin-aldosterone system, endothelial dysfunction leading to vasoconstriction, increased sodium retention, or arterial stiffening. Risk factors include genetics, diet (high sodium, low potassium), obesity, physical inactivity, stress, smoking, and aging.",
                        "key_info": ["Controlled by cardiac output, peripheral resistance, blood volume, viscosity", "Short-term: autonomic nervous system, hormones", "Long-term: RAAS and ADH", "Develops from disrupted regulatory mechanisms", "Causes: increased sympathetic activity, RAAS dysfunction, endothelial issues", "Risk factors: genetics, diet, obesity, inactivity, stress, smoking, aging"]
                    }
                ]
            }
        ]
        
        for topic_data in sample_topics:
            # Create topic
            topic = EssayQATopic(
                topic=topic_data["topic"],
                category=topic_data["category"],
                subcategory=topic_data["subcategory"],
                creation_timestamp=datetime.datetime.now()
            )
            db.add(topic)
            db.flush()  # To get the ID
            
            # Add questions
            for q_data in topic_data["questions"]:
                question = EssayQAQuestion(
                    question=q_data["question"],
                    full_answer=q_data["full_answer"],
                    key_info=q_data["key_info"],
                    topic_id=topic.id
                )
                db.add(question)
        
        db.commit()
        print("Sample EssayQA data created successfully!")
    else:
        print(f"Found {len(Essay_qa_topics)} existing EssayQA topics, no need to create sample data.")
    
    print("Database changes applied successfully!")
except Exception as e:
    db.rollback()
    print(f"Error applying database changes: {e}")
finally:
    db.close() 