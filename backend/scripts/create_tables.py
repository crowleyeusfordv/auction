from app.db.session import engine
from app.db.base import Base
from app.models import user, auction, bid  # 确保模型被导入注册到元数据

def main():
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    main()