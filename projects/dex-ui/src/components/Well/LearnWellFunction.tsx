import React, { useEffect } from "react";
import styled from "styled-components";
import { ExpandBox } from "src/components/ExpandBox";
import { TextNudge } from "../Typography";
import { FC } from "src/types";
import { WellFunction as WellFunctionIcon } from "../Icons";
import { Well } from "@beanstalk/sdk-wells";
import { CONSTANT_PRODUCT_2_ADDRESS } from "src/utils/addresses";
import { formatWellTokenSymbols } from "src/wells/utils";

type Props = {
  well: Well | undefined;
};

function WellFunctionDetails({ well }: Props) {
  const functionName = well?.wellFunction?.name;

  useEffect(() => {
    if (!functionName) {
      well?.getWellFunction();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionName]);

  if (functionName === "Constant Product") {
    return (
      <TextContainer>
        <div>
          A Well Function is a pricing function for determining how many tokens users receive for
          swaps, how many LP tokens a user receives for adding liquidity, etc.
        </div>
        <div>
          <FunctionNameStyled>Constant Product</FunctionNameStyled> is a reusable pricing function
          which prices tokens using:
        </div>
        <div>
          <Bold>x * y = k</Bold>, where <Bold>x</Bold> is the amount of one token, <Bold>y</Bold> is
          the amount of the other and <Bold>k</Bold> is a fixed constant.
        </div>
      </TextContainer>
    );
  } else if (well?.wellFunction?.address.toLowerCase() === CONSTANT_PRODUCT_2_ADDRESS) {
    return (
      <TextContainer>
        <div>
          A Well Function is a pricing function for determining how many tokens users receive for
          swaps, how many LP tokens a user receives for adding liquidity, etc.
        </div>
        <div>
          The {formatWellTokenSymbols(well)} uses the Constant Product 2 Well Function, which is a
          gas-efficient pricing function for Wells with 2 tokens.
        </div>
      </TextContainer>
    );
  } else {
    return (
      <TextContainer>
        <div>
          A Well Function is a pricing function for determining how many tokens users receive for
          swaps, how many LP tokens a user receives for adding liquidity, etc.
        </div>
        <div>Each Well utilizes a unique pricing function to price the tokens in the Well.</div>
      </TextContainer>
    );
  }
}

export const LearnWellFunction: FC<Props> = ({ well }) => {
  const name = well?.wellFunction?.name;

  const drawerHeaderText = well?.wellFunction?.name
    ? `What is ${name}?`
    : "What is a Well Function?";

  return (
    <ExpandBox drawerHeaderText={drawerHeaderText}>
      <ExpandBox.Header>
        <WellFunctionIcon />
        <TextNudge amount={1}>What is {name}?</TextNudge>
      </ExpandBox.Header>
      <ExpandBox.Body>
        <WellFunctionDetails well={well} />
      </ExpandBox.Body>
    </ExpandBox>
  );
};

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #4b5563;
`;

const FunctionNameStyled = styled.span`
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 1px;
`;

const Bold = styled.span`
  font-weight: 600;
`;
