export const handleApiError = (error, fallbackMessage) => {
  console.error(error);
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage ||
    "Something went wrong"
  );
};
