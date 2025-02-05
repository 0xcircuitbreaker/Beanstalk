import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FC } from "src/types";
import styled from "styled-components";
import { Footer } from "./Footer";
import { Window } from "./Window";
import { Settings } from "src/settings";
import CustomToaster from "../TxnToast/CustomToaster";
import buildIcon from "src/assets/images/navbar/build.svg";
import swapIcon from "src/assets/images/navbar/swap.svg";
import wellsIcon from "src/assets/images/navbar/wells.svg";
import { LinksNav } from "../Typography";
import { BurgerMenuIcon, Discord, Github, Logo, Twitter, X, BeanstalkLogoBlack } from "../Icons";
import { TokenMarquee } from "./TokenMarquee";
import { WalletButton } from "src/components/Wallet";
import { theme } from "src/utils/ui/theme";
import { useChainId } from "wagmi";

export const Frame: FC<{}> = ({ children }) => {
  const isNotProd = !Settings.PRODUCTION;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chain = useChainId();

  return (
    <Container id="frame">
      {/* Desktop */}
      <NavContainer>
        <NavGrid>
          <BrandContainer onClick={() => setMobileMenuOpen(false)}>
            <Brand>
              <Link to={"/"}>
                <Logo /> <BasinText>BASIN</BasinText>
              </Link>
            </Brand>
          </BrandContainer>
          <LinksContainer>
            <NavLinks>
              <NavLink to="/build" hovericon={buildIcon}>
                Build
              </NavLink>
              <NavLink to="/wells" hovericon={wellsIcon}>
                Liquidity
              </NavLink>
              <NavLink to="/swap" hovericon={swapIcon}>
                Swap
              </NavLink>
              {(isNotProd || false) && <NavLink to="/dev">Dev</NavLink>}
            </NavLinks>
          </LinksContainer>
          <StyledConnectContainer>
            <WalletButton />
          </StyledConnectContainer>
          <DropdownMenu open={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <BurgerMenuIcon />}
          </DropdownMenu>
        </NavGrid>
      </NavContainer>
      <TokenMarquee />
      <Window>
        <CustomToaster />
        <BurgerMenu open={mobileMenuOpen}>
          <MobileNavLinkContainer>
            <MobileNavLink $bold to="/swap" onClick={() => setMobileMenuOpen(false)}>
              Swap
            </MobileNavLink>
            <MobileNavLink $bold to="/wells" onClick={() => setMobileMenuOpen(false)}>
              Wells
            </MobileNavLink>
            <MobileNavLink $bold to="/build" onClick={() => setMobileMenuOpen(false)}>
              Build
            </MobileNavLink>
            {isNotProd && (
              <MobileNavLink $bold to="/dev" onClick={() => setMobileMenuOpen(false)}>
                Dev
              </MobileNavLink>
            )}
            <MobileLargeNavRow onClick={() => setMobileMenuOpen(false)}>
              <Box href="https://basin.exchange/discord" rel="noopener noreferrer" target="_blank">
                <Discord width={20} />
              </Box>
              <Box
                href="https://twitter.com/basinexchange"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Twitter width={20} />
              </Box>
              <Box
                href="https://github.com/BeanstalkFarms/Basin"
                rel="noopener noreferrer"
                target="_blank"
              >
                <Github width={20} />
              </Box>
              <Box href="https://bean.money" rel="noopener noreferrer" target="_blank">
                <BeanstalkLogoBlack width={20} />
              </Box>
            </MobileLargeNavRow>
            <MobileNavRow
              href="https://immunefi.com/bounty/beanstalk/"
              rel="noopener noreferrer"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bug Bounty Program
            </MobileNavRow>
            <MobileNavRow
              href="https://docs.basin.exchange/"
              rel="noopener noreferrer"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </MobileNavRow>
          </MobileNavLinkContainer>
          <MobileConnectContainer>
            <WalletButton />
          </MobileConnectContainer>
        </BurgerMenu>
        {/* TODO Restore this */}
        {/* {chain?.unsupported ? <Title title="Unsupported Chain" /> : children} */}
        {children}
      </Window>
      <Footer />
    </Container>
  );
};

type NavLinkProps = {
  hovericon?: string;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  align-items: center;

  ${theme.media.query.sm.only} {
    width: 100svw;
    height: 100svh;
  }
`;

const NavContainer = styled.nav`
  border-bottom: 0.5px solid black;
  display: flex;
  width: 100vw;
  height: 56px;
  min-height: 56px;
  box-sizing: border-box;
  padding: 0px;

  ${theme.media.query.md.up} {
    height: 64px;
    min-height: 64px;
  }
`;

const NavGrid = styled.div`
  display: grid;
  grid-template-columns: 178px 1fr 192px;
  align-items: center;
  height: 100%;
  width: 100%;

  ${theme.media.query.md.down} {
    grid-template-columns: 1fr 1fr;
  }
`;

const NavLinks = styled.div`
  display: none;
  ${theme.media.query.md.up} {
    display: flex;
    align-self: stretch;
    align-items: center;
  }
`;
const NavLink = styled(Link)<NavLinkProps>`
  border-left: 0.5px solid black;
  box-sizing: border-box;
  display: flex;
  width: 192px;
  align-self: stretch;
  align-items: center;
  justify-content: center;

  text-decoration: none;
  text-transform: uppercase;

  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: black;
  outline: none !important;
  cursor: ${(props) => (props.hovericon ? `url(${props.hovericon}), auto` : "pointer")};

  :focus {
    outline: none !important;
  }
  :hover {
    background-color: #f0fdf4;
  }
  &:last-child {
    border-right: 0.5px solid black;
  }
`;
const LinksContainer = styled.div`
  display: flex;
  justify-self: center;
  flex-direction: row;
  align-self: stretch;

  ${theme.media.query.md.down} {
    display: none;
  }
`;

const BrandContainer = styled.div`
  display: flex;
  direction: row;
  flex: 1;
  align-self: stretch;
  align-items: center;

  ${theme.media.query.md.down} {
    justify-self: flex-start;
  }
`;

const BasinText = styled.div`
  margin-bottom: -4px;
`;

const Brand = styled.div`
  display: flex;
  flex-direction: row;
  padding-left: 16px;

  a {
    display: flex;
    gap: 4px;
    align-items: center;
    ${LinksNav}
    text-decoration: none;
    text-transform: uppercase;
    color: #0f172a;

    :focus {
      outline: none;
    }
  }

  ${theme.media.query.md.up} {
    justify-self: flex-start;
    padding-left: 48px;
  }
`;

const StyledConnectContainer = styled.div`
  display: none;
  ${theme.media.query.md.up} {
    display: flex;
    direction: row;
    width: 192px;
    align-self: stretch;
    align-items: center;
    justify-content: center;
    border-left: 0.5px solid black;
    box-sizing: border-box;
  }
`;

const DropdownMenu = styled.button<{ open?: boolean }>`
  cursor: pointer;
  border: 0px;
  color: #000;
  background: #fff;
  :hover {
    background: #fff;
  }
  :focus {
    outline: #fff;
  }
  height: 100%;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 9px;
  justify-self: flex-end;

  ${theme.media.query.md.up} {
    display: none;
  }
  div {
    :first-child {
      transition: all 0.3s linear;
      transform-origin: 0% 50%;
      transform: ${({ open }) => (open ? `rotate(45deg)` : `rotate(0)`)};
    }
    :last-child {
      transition: all 0.3s linear;
      transform-origin: 0% 50%;
      transform: ${({ open }) => (open ? `rotate(-45deg)` : `rotate(0)`)};
    }
  }
`;

const BurgerMenu = styled.div<{ open: boolean }>`
  background-color: #fff;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  width: 100vw;
  justify-content: space-between;
  position: absolute;
  transition: transform 0.3s ease-in-out;
  border-left: 0.5px solid black;
  margin-left: -0.5px;
  transform: ${(props) => (props.open ? `translateX(0%)` : `translateX(100%)`)};
  z-index: 9999;

  ${theme.media.query.md.up} {
    display: none;
  }
`;

const MobileNavLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const MobileNavLink = styled(Link)<{ $bold?: boolean }>`
  width: 100%;
  border-bottom: 0.5px solid black;
  padding: 16px;
  text-transform: uppercase;
  text-decoration: none;
  color: black;
  font-weight: ${(props) => (props.$bold ? `600` : `normal`)};
  ${(props) => props.$bold && `letter-spacing: 0.96px;`}
`;

const MobileNavRow = styled.a<{ $bold?: boolean }>`
  width: 100%;
  border-bottom: 0.5px solid black;
  padding: 16px;
  text-transform: uppercase;
  text-decoration: none;
  color: black;
  font-weight: ${(props) => (props.$bold ? `600` : `normal`)};
  ${(props) => props.$bold && `letter-spacing: 0.96px;`}
`;

const MobileLargeNavRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  border-bottom: 0.5px solid black;
  color: black;
`;

const MobileConnectContainer = styled.div`
  display: flex;
  direction: row;
  padding: 16px;
  align-self: stretch;
  justify-content: center;
  border-top: 0.5px solid black;
`;

const Box = styled.a`
  display: flex;
  flex: 1;
  padding: 32px;
  border-left: 0.5px solid black;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  color: black;
  :first-child {
    border-left: none;
  }
`;
