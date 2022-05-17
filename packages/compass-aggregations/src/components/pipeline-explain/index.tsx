import React, { useEffect } from 'react';
import {
  css,
  spacing,
  Modal,
  CancelLoader,
  H3,
  ModalFooter,
  Button,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import type { ExplainData } from '../../modules/explain';
import {
  explainAggregation,
  closeExplainModal,
  cancelExplain,
} from '../../modules/explain';
import { ExplainResults } from './explain-results';
import { ExplainError } from './explain-error';

type PipelineExplainProps = {
  isModalOpen: boolean;
  isLoading: boolean;
  error?: RootState['explain']['error'];
  explain?: ExplainData;
  onCloseModal: () => void;
  onRunExplain: () => void;
  onCancelExplain: () => void;
};

const contentStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const footerStyles = css({
  paddingRight: 0,
  paddingBottom: 0,
});

export const PipelineExplain: React.FunctionComponent<PipelineExplainProps> = ({
  isModalOpen,
  isLoading,
  error,
  explain,
  onCloseModal,
  onRunExplain,
  onCancelExplain,
}) => {
  useEffect(() => {
    isModalOpen && onRunExplain();
  }, [isModalOpen, onRunExplain]);

  let content = null;
  if (isLoading) {
    content = (
      <CancelLoader
        dataTestId="pipeline-explain-cancel"
        cancelText="Cancel"
        onCancel={() => onCancelExplain()}
        progressText="Running explain"
      />
    );
  } else if (error) {
    content = (
      <ExplainError
        message={error.message}
        isNetworkError={error.isNetworkError}
        onRetry={onRunExplain}
      />
    );
  } else if (explain) {
    content = <ExplainResults plan={explain.plan} stats={explain.stats} />;
  }

  const modalFooter = (
    <ModalFooter className={footerStyles}>
      <Button
        onClick={onCloseModal}
        data-testid="pipeline-explain-footer-close-button"
      >
        Close
      </Button>
    </ModalFooter>
  );

  const isFooterHidden = isLoading || error?.isNetworkError;

  return (
    <Modal
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid="pipeline-explain-modal"
    >
      <H3>Explain</H3>
      <div className={contentStyles}>{content}</div>
      {!isFooterHidden && modalFooter}
    </Modal>
  );
};

const mapState = ({
  explain: { isModalOpen, isLoading, error, explain },
}: RootState) => ({
  isModalOpen,
  isLoading,
  error,
  explain,
});

const mapDispatch = {
  onCloseModal: closeExplainModal,
  onRunExplain: explainAggregation,
  onCancelExplain: cancelExplain,
};
export default connect(mapState, mapDispatch)(PipelineExplain);
