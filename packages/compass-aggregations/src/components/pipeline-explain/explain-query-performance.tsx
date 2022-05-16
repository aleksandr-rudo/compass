import React from 'react';
import { Body, Subtitle, css, spacing } from '@mongodb-js/compass-components';
import type { IndexInformation } from '@mongodb-js/explain-plan-helper';

import { ExplainIndexes } from './explain-indexes';

type ExplainQueryPerformanceProps = {
  executionTimeMillis: number;
  nReturned: number;
  usedIndexes: IndexInformation[];
};

const containerStyles = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
});

const statsStyles = css({
  gap: spacing[1],
  display: 'flex',
  flexDirection: 'column',
});

const statItemStyles = css({
  display: 'flex',
  gap: spacing[1],
});

const statTitleStyles = css({
  whiteSpace: 'nowrap',
});

export const ExplainQueryPerformance: React.FunctionComponent<ExplainQueryPerformanceProps> =
  ({ nReturned, executionTimeMillis, usedIndexes }) => {
    return (
      <div className={containerStyles}>
        <Subtitle>Query Performance Summary</Subtitle>
        <div className={statsStyles}>
          <div className={statItemStyles}>
            <Body>Documents returned:</Body>
            <Body weight="medium">{nReturned}</Body>
          </div>
          <div className={statItemStyles}>
            <Body>Actual Query Execution time(ms):</Body>
            <Body weight="medium">{executionTimeMillis}</Body>
          </div>
          <div className={statItemStyles}>
            <Body className={statTitleStyles}>
              Query used the following indexes:
            </Body>
            <ExplainIndexes indexes={usedIndexes} />
          </div>
        </div>
      </div>
    );
  };
