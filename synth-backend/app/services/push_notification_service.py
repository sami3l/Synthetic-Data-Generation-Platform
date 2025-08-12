import httpx
import asyncio
from typing import List, Optional
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

class PushNotificationService:
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    
    @classmethod
    async def send_push_notification(
        cls, 
        user: User, 
        title: str, 
        body: str, 
        data: Optional[dict] = None
    ) -> bool:
        """Envoie une notification push à un utilisateur spécifique"""
        if not user.push_token:
            logger.warning(f"Aucun token push pour l'utilisateur {user.id}")
            return False
            
        return await cls.send_to_token(user.push_token, title, body, data)
    
    @classmethod
    async def send_to_token(
        cls, 
        push_token: str, 
        title: str, 
        body: str, 
        data: Optional[dict] = None
    ) -> bool:
        """Envoie une notification push à un token spécifique"""
        try:
            message = {
                "to": push_token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
            }
            
            if data:
                message["data"] = data
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    cls.EXPO_PUSH_URL,
                    json=message,
                    headers={
                        "Accept": "application/json",
                        "Accept-encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("data", {}).get("status") == "ok":
                        logger.info(f"Notification envoyée avec succès au token {push_token[:10]}...")
                        return True
                    else:
                        logger.error(f"Erreur Expo: {result}")
                        return False
                else:
                    logger.error(f"Erreur HTTP {response.status_code}: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Erreur lors de l'envoi de la notification push: {e}")
            return False
    
    @classmethod
    async def send_to_multiple_users(
        cls, 
        users: List[User], 
        title: str, 
        body: str, 
        data: Optional[dict] = None
    ) -> int:
        """Envoie une notification push à plusieurs utilisateurs"""
        tasks = []
        for user in users:
            if user.push_token:
                task = cls.send_push_notification(user, title, body, data)
                tasks.append(task)
        
        if not tasks:
            return 0
            
        results = await asyncio.gather(*tasks, return_exceptions=True)
        success_count = sum(1 for result in results if result is True)
        
        logger.info(f"Notifications envoyées: {success_count}/{len(tasks)}")
        return success_count
