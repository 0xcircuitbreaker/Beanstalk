import React from "react";

import styled from "styled-components";

import { size } from "src/breakpoints";
import { LoadingTemplate } from "src/components/LoadingTemplate";
import { Page } from "src/components/Page";
import { Title } from "src/components/PageComponents/Title";
import { SwapRoot } from "src/components/Swap/SwapRoot";
import { useTokens } from "src/tokens/useTokens";

export const Swap = () => {
  const tokens = useTokens();

  const loading = !Object.keys(tokens).length;

  return (
    <Page>
      <Title title="Swap" fontWeight={"600"} largeOnMobile />
      {loading ? (
        <Container>
          <LoadingTemplate.Input />
          <LoadingTemplate.Arrow />
          <LoadingTemplate.Input />
          <LoadingTemplate.LabelValue labelWidth={120} />
          <LoadingTemplate.Button />
        </Container>
      ) : (
        <SwapRoot />
      )}
    </Page>
  );
};

const Container = styled.div`
  width: 384px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: ${size.mobile}) {
    width: 100%;
    gap: 16px;
  }
`;
