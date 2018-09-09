import React from "react";
import PropTypes from "prop-types";
import { theme } from "styled-tools";
import callAll from "../_utils/callAll";
import styled from "../styled";
import as from "../as";
import Box from "../Box";

const Component = ({ onClick, ...props }) => (
  <Box onClick={callAll(props.show, onClick)} {...props} />
);

const HiddenShow = styled(Component)`
  ${theme("HiddenShow")};
`;

HiddenShow.propTypes = {
  show: PropTypes.func.isRequired,
  onClick: PropTypes.func
};

export default as("button")(HiddenShow);