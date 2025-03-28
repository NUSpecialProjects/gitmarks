import { useState, useCallback, useEffect, ReactElement } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../Button";
import './styles.css';
import LoadingSpinner from "../LoadingSpinner";
import { ErrorToast } from "../Toast";
import { toast } from "react-toastify";

const MultiStepForm = <T,>({
  steps,
  cancelLink,
  initialData,
}: IMultiStepFormProps<T>): ReactElement => {
  // Default form state
  const [formData, setFormData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const errorToastId = "multi-step-form-error";

  const dismissErrorToast = useCallback(() => {
    toast.dismiss(errorToastId);
  }, [errorToastId]);

  // Show an error toast
  const showErrorToast = useCallback((message: string) => {
    ErrorToast(message, errorToastId);
  }, [errorToastId]);

  // Step navigation
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Site navigation
  const navigate = useNavigate();
  const location = useLocation();
  const handleCancel = () => navigate(cancelLink);

  // Fetch step from URL on load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const stepFromUrl = parseInt(searchParams.get("step") || "0", 10);

    if (!isNaN(stepFromUrl) && stepFromUrl >= 0 && stepFromUrl < totalSteps) {
      setCurrentStepIndex(stepFromUrl);
    } else {
      setCurrentStepIndex(0);
    }
  }, [location.search, totalSteps]);

  // Update URL with current step
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const stepFromUrl = parseInt(searchParams.get("step") || "0", 10);

    if (stepFromUrl !== currentStepIndex) {
      searchParams.set("step", String(currentStepIndex));

      // Only replace the URL if the step query parameter doesn't exist
      const shouldReplace = !searchParams.has("step");
      navigate(`?${searchParams.toString()}`, { replace: shouldReplace });
    }
  }, [currentStepIndex, navigate]);

  // Navigate backwards when the page exists
  const handlePrevious = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Update form data, clearing errors on form change
  const handleDataChange = useCallback(
    (newData: Partial<T>) => {
      setFormData((prevData) => ({
        ...prevData,
        ...newData,
      }));
      dismissErrorToast();
    },
    [dismissErrorToast]
  );

  // Handle next button click, preventing progression on error
  const handleNext = useCallback(async () => {
    setIsLoading(true);
    const currentStep = steps[currentStepIndex];

    try {
      await currentStep.onNext(formData);
      dismissErrorToast();

      if (!isLastStep) {
        setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
      }
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "An error occurred. Please try again.";
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [steps, currentStepIndex, formData, isLastStep, totalSteps, dismissErrorToast, showErrorToast]);

  const CurrentStepComponent = steps[currentStepIndex].component;
  return (
    <div className="MultiStepForm">
      <div className="MultiStepForm__content">
        {/* Display current step */}
        <div className="MultiStepForm__formStep">
          <CurrentStepComponent data={formData} onChange={handleDataChange} />
        </div>

        {/* Render navigation buttons */}
        <div className="MultiStepForm__formNavigationButtonsWrapper">
          {isFirstStep && (
            <Button onClick={handleCancel} variant="secondary" disabled={isLoading}>
              Cancel
            </Button>
          )}
          {!isFirstStep && (
            <Button onClick={handlePrevious} variant="secondary" disabled={isLoading}>
              Previous
            </Button>
          )}
          <Button onClick={handleNext} variant="primary" disabled={isLoading}>
            {isLastStep ? "Finish" : "Continue"}
          </Button>
        </div>
      </div>

      {/* Spinner Overlay */}
      {isLoading && (
        <div className="MultiStepForm__spinnerOverlay">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default MultiStepForm;