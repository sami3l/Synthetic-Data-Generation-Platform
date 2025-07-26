from sqlalchemy.orm import Session
from app.models.DataRequest import DataRequest
from app.models.RequestParameters import RequestParameters

class DataRequestService:

    # @staticmethod
    # def create_request(db: Session, user_id: int, params: dict):
    #     data_request = DataRequest(user_id=user_id)
    #     db.add(data_request)
    #     db.commit()
    #     db.refresh(data_request)

    #     request_params = RequestParameters(
    #         request_id=data_request.id,
    #         model_type=params.get("model_type", "ctgan"),
    #         epochs=params.get("epochs", 300),
    #         batch_size=params.get("batch_size", 500),
    #         learning_rate=params.get("learning_rate", 2e-4),
    #         optimization_enabled=params.get("optimization_enabled", False),
    #         optimization_search_type=params.get("optimization_search_type", "grid"),
    #         optimization_n_trials=params.get("optimization_n_trials", 5),
    #     )

    #     db.add(request_params)
    #     db.commit()
    #     return data_request
    
    def create_request(db: Session, user_id: int, params: dict):
        validated_params = RequestParameters(**params)
        data_request = DataRequest(user_id=user_id)
        db.add(data_request)
        db.commit()
        db.refresh(data_request)

        request_params = RequestParameters(
            request_id=data_request.id,
            **validated_params.dict()
        )
        db.add(request_params)
        db.commit()
        return data_request