import axios from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    switch (error.response?.status) {
      case 400:
        return 'Invalid request data';
      case 401:
        return 'Session expired, please log in again';
      case 403:
        return 'You do not have permission for this action';
      case 404:
        return 'The requested item was not found';
      case 409:
        return 'This item already exists';
      case 422:
        return 'Validation failed';
      case 429:
        return 'Too many requests, please slow down';
      case 500:
        return 'Server error, please try again';
      default:
        return `Request failed (${error.response?.status ?? 'unknown'})`;
    }
  }

  return 'An unexpected error occurred';
}
