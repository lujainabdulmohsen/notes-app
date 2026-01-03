from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note

User = get_user_model()

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at"]

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "password"]

    def create(self, validated_data):
        email = validated_data.get("email")
        password = validated_data.pop("password")

        user = User(
            username=email,
            email=email,
        )
        user.set_password(password)
        user.save()
        return user
