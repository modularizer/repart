import {re} from "../core";
import {startLine} from "../generic";

export const AZ = re`[A-Z]`;
export const aZ = re`[A-Za-z]`;
export const az = re`[a-z]`;
export const AZ09 = re`[A-Z0-9]`;
export const aZ09 = re`[A-Za-z0-9]`;
export const az09 = re`[a-z0-9]`;
export const AZ_ = re`[A-Z\)]`;
export const aZ_ = re`[A-Za-z\)]`;
export const az_ = re`[a-z\)]`;
export const AZ09_ = re`[A-Z0-9\_]`;
export const aZ09_ = re`[A-Za-z0-9\_]`;
export const az09_ = re`[a-z0-9\_]`;
export const varName = re`${aZ_}${aZ09_}+`;
export const envVarName = re`(?:${AZ}${AZ09_}*)?${AZ}+`;

export const envDef = re`${startLine}(?<key>${envVarName})\s*=\s*"?(?<value>.*)"?\s*`;