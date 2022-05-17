import React from 'react';
import {
  css,
  spacing,
  Subtitle,
  ErrorSummary,
  Button,
} from '@mongodb-js/compass-components';

type ExplainErrorProps = {
  isNetworkError: boolean;
  message: string;
  onRetry: () => void;
};

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: spacing[4],
  marginBottom: spacing[4],
});

const textStyles = css({
  textAlign: 'center',
  marginTop: spacing[4],
  marginBottom: spacing[4],
});

export const ExplainError: React.FunctionComponent<ExplainErrorProps> = ({
  isNetworkError,
  message,
  onRetry,
}) => {
  if (!isNetworkError) {
    return (
      <ErrorSummary data-testId="pipeline-explain-error" errors={[message]} />
    );
  }

  return (
    <div className={containerStyles}>
      <Subtitle className={textStyles}>
        Oops! Looks like we hit a network issue. <br />
        Let&apos;s try that again.
      </Subtitle>
      <Button
        variant="primaryOutline"
        onClick={onRetry}
        data-testid="pipeline-explain-retry-button"
      >
        Retry
      </Button>
    </div>
  );
};
