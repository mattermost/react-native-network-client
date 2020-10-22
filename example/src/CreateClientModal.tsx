// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as React from 'react';
import {
    Button,
    SafeAreaView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import NetworkClient, {ApiClientInterface} from 'react-native-network-client';
import Modal from 'react-native-modal';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        backgroundColor: 'white',
        padding: 10,
    },
});

interface CreateClientModalProps {
    visible: boolean;
    createClient(client: ApiClientInterface): void;
}

const CreateClientModal = ({visible, createClient}: CreateClientModalProps) => {
    const [rootUrl, setRootUrl] = React.useState('');

    const create = async () => {
        const client = await NetworkClient.getOrCreateNetworkClient(rootUrl);
        createClient(client);
    };

    return (
        <Modal isVisible={visible}>
            <SafeAreaView style={styles.container}>
                <View style={styles.modalContent}>
                    <TextInput
                        autoCapitalize='none'
                        placeholder='community.mattermost.com'
                        value={rootUrl}
                        onChangeText={setRootUrl}
                    />
                    <Button
                        disabled={rootUrl.length === 0}
                        title='Create'
                        onPress={create}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default CreateClientModal;