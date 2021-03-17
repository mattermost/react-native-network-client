// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

type Header = {
    key: string;
    value: string;
};

type File = {
    name?: string;
    size?: number;
    type?: string;
    uri?: string;
};

type FileContent = {
    name: string;
    type: string;
    content: string;
    encoding: BufferEncoding;
};
