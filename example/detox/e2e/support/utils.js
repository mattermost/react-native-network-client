// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import { v4 as uuidv4 } from "uuid";

/**
 * Explicit `wait` should not normally used but made available for special cases.
 * @param {number} ms - duration in millisecond
 * @return {Promise} promise with timeout
 */
export const wait = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if android.
 * @return {boolean} true if android
 */
export const isAndroid = () => {
    return device.getPlatform() === "android";
};

/**
 * Check if ios.
 * @return {boolean} true if ios
 */
export const isIos = () => {
    return device.getPlatform() === "ios";
};

/**
 * Get host.
 * @param {string} url - URL to download file from
 * @returns {string} host from URL
 */
export const getHost = (url) => {
    return url.split("//")[1];
};

/**
 * Get random id.
 * @param {number} length - length on random string to return, e.g. 6 (default)
 * @return {string} random string
 */
export const getRandomId = (length = 6) => {
    const MAX_SUBSTRING_INDEX = 27;

    return uuidv4()
        .replace(/-/g, "")
        .substring(MAX_SUBSTRING_INDEX - length, MAX_SUBSTRING_INDEX);
};

/**
 * Get random integer.
 * @param {number} max - max number exclusive, e.g. 10 (default), expected 0 - 9
 * @return {number} random integer
 */
export const getRandomInt = (max = 10) => {
    return Math.floor(Math.random() * Math.floor(max));
};

/**
 * Get random item.
 * @param {array} items - array of objects
 * @returns {Object} random item from array
 */
export const getRandomItem = (items) => {
    return items[Math.floor(Math.random() * items.length)];
};

/**
 * Capitalize first character of text.
 * @param {string} text
 * @return {string} capitalized text
 */
export const capitalize = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const SECOND = 1000;
const MINUTE = 60 * 1000;

export const timeouts = {
    HALF_SEC: SECOND / 2,
    ONE_SEC: SECOND,
    TWO_SEC: SECOND * 2,
    FOUR_SEC: SECOND * 4,
    TEN_SEC: SECOND * 10,
    HALF_MIN: MINUTE / 2,
    ONE_MIN: MINUTE,
    TWO_MIN: MINUTE * 2,
    FOUR_MIN: MINUTE * 4,
};
