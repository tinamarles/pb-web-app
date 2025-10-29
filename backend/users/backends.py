from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

class EmailOrUsernameModelBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            # Look up the user by username or email, in a case-insensitive manner
            user = UserModel.objects.get(Q(username__iexact=username) | Q(email__iexact=username))
            if user.check_password(password):
                return user
        except UserModel.DoesNotExist:
            # This is a security measure to prevent timing attacks.
            # We still run a password check, even if the user doesn't exist.
            UserModel().set_password(password)
        return None # Explicitly return None on failure
