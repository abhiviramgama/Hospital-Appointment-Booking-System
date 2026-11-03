from rest_framework import permissions


class IsPlatformAdmin(permissions.BasePermission):
    """Allows access only to authenticated staff or admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_staff or request.user.is_superuser)
        )


class IsAppointmentOwnerOrAdmin(permissions.BasePermission):
    """Ensures patient can only view, modify or cancel their own appointments."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'admin' or request.user.is_staff or request.user.is_superuser:
            return True
        return obj.patient == request.user
