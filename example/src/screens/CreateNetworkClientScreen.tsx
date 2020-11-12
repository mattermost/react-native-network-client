// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef, useEffect} from 'react';
import {
    Alert,
    Button,
    Platform,
    PlatformColor,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import DeviceInfo from 'react-native-device-info';
import {getOrCreateAPIClient} from '@mattermost/react-native-network-client';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
    },
    label: {
        padding: 5,
    },
    input: {
        margin: 15,
        height: 40,
        borderWidth: 1,
        padding: 5,
        ...Platform.select({
            ios: { borderColor: PlatformColor('link') },
            android: {
                borderColor: PlatformColor('?attr/colorControlNormal')
            },
        }),
     },
     headersLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
     },
     headersContainer: {
        flex: 8,
     },
     header: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
     },
    followRedirectsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
     },
});

const ClientHeader = ({index, header, updateHeader}) => {
    const [key, setKey] = useState(header.key);
    const [value, setValue] = useState(header.value);

    const doUpdateHeader = () => {
        updateHeader(index, {key, value});
    }

    return (
        <>
            <TextInput
                value={key}
                onChangeText={setKey}
                placeholder='key'
                autoCapitalize='none'
                onBlur={doUpdateHeader}
                style={[styles.input, {flex: 1}]}
            />
            <TextInput
                value={value}
                onChangeText={setValue}
                placeholder='value'
                autoCapitalize='none'
                onBlur={doUpdateHeader}
                style={[styles.input, {flex: 1}]}
            />
        </>
    );

}

export default function CreateNetworkClientScreen({navigation}) {
    const [name, setName] = useState('HTTP Google Redirect Test');
    const [baseUrl, setbaseUrl] = useState('http://google.com');
    const [clientHeaders, setClientHeaders] = useState([]);
    const [followRedirects, setFollowRedirects] = useState(true);
    const scrollView = useRef(null);

    // TEST MM default headers
    const addDefaultHeaders = async () => {
        const userAgent = await DeviceInfo.getUserAgent();
        setClientHeaders([
            {key: 'X-Requested-With', value: 'XMLHttpRequest'},
            {key: 'User-Agent', value: userAgent},
            {key: '', value: ''},
        ]);
    }
    useEffect(() => {
        addDefaultHeaders();
    }, []);


    const sanitizeHeaders = async () => {
        const headers = {};
        clientHeaders.forEach(({key, value}) => {
           if (key && value) {
               headers[key] = value;
           } 
        });

        return headers;
    }

    const createClient = async () => {
        const headers = await sanitizeHeaders();
        const options = {
            headers,
            followRedirects,
        };
        const {client, created} = await getOrCreateAPIClient(baseUrl, options);
        if (!created) {
            Alert.alert(
                'Error',
                `A client for ${baseUrl} already exists`,
                [{text: 'OK'}],
                {cancelable: false}
            );
            return;
        }
        const createdClient = {
            name,
            client,
            type: 'network',
        };

        navigation.navigate('ClientList', {client: createdClient});
    }

    const addClientHeader = () => {
        setClientHeaders([...clientHeaders, {key: '', value: ''}]);
        scrollView.current.scrollToEnd();
    }

    const updateClientHeader = (index, header) => {
        const newClientHeaders = clientHeaders;
        newClientHeaders[index] = header;
        setClientHeaders(newClientHeaders);
    };

    const renderClientHeaders = () => (
        <ScrollView ref={scrollView} contentContainerStyle={styles.scrollViewContainer}>
            {
                clientHeaders.map((header, index) => (
                    <View key={`header-${index}`} style={styles.header}>
                        <ClientHeader index={index} header={header} updateHeader={updateClientHeader} />
                    </View>
                ))
            }
        </ScrollView>
    )

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.label}>Name</Text>
            <TextInput
                value={name}
                onChangeText={setName}
                placeholder='Mattermost Community Server'
                autoCapitalize='none'
                style={styles.input}
            />

            <Text style={styles.label}>Root URL</Text>
            <TextInput
                value={baseUrl}
                onChangeText={setbaseUrl}
                placeholder='https://community.mattermost.com'
                autoCapitalize='none'
                style={styles.input}
            />

            <View style={styles.followRedirectsContainer}>
                <Text style={styles.label}>Follow Redirects?</Text>
                <CheckBox
                    value={followRedirects}
                    onValueChange={setFollowRedirects}
                    style={styles.checkbox}
                />
            </View>

            <View style={styles.headersLabelContainer}>
                <Text style={styles.label}>Client Headers</Text>
                <Button title='+' onPress={addClientHeader}/>
            </View>
            <View style={styles.headersContainer}>
                {renderClientHeaders()}
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title='Create'
                    disabled={name.length === 0 || baseUrl.length === 0}
                    onPress={createClient}
                />
            </View>
        </SafeAreaView>
    );
}