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

const EXPONENTIAL_RETRY = 'exponential';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    textInputContainer: {
        flex: 5,
    },
    numericInputContainer: {
        flex: 0.5,
    },
    label: {
        padding: 5,
        flex: 1,
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

export default function CreateAPIClientScreen({navigation}) {
    const [name, setName] = useState('HTTP Google Redirect Test');
    const [baseUrl, setbaseUrl] = useState('http://google.com');
    const [clientHeaders, setClientHeaders] = useState([]);
    const [sessionOptions, setSessionOptions] = useState({
        followRedirects: true,
        allowsCellularAccess: true,
        waitsForConnectivity: false,
        timeoutIntervalForRequest: '30',
        timeoutIntervalForResource: '30',
        httpMaximumConnectionsPerHost: '10',
    });
    const [retryPolicyOptions, setRetryPolicyOptions] = useState({
        type: '',
        retryLimit: '',
        exponentialBackoffBase: '',
        exponentialBackoffScale: '',
    });
    const scrollView = useRef(null);

    const setFollowRedirects = (followRedirects) => setSessionOptions({...sessionOptions, followRedirects});
    const setAllowsCellularAccess = (allowsCellularAccess) => setSessionOptions({...sessionOptions, allowsCellularAccess});
    const setWaitsForConnectivity = (waitsForConnectivity) => setSessionOptions({...sessionOptions, waitsForConnectivity});
    const setTimeoutIntervalForRequest = (timeoutIntervalForRequest) => setSessionOptions({...sessionOptions, timeoutIntervalForRequest});
    const setTimeoutIntervalForResource = (timeoutIntervalForResource) => setSessionOptions({...sessionOptions, timeoutIntervalForResource});
    const setHttpMaximumConnectionsPerHost = (httpMaximumConnectionsPerHost) => setSessionOptions({...sessionOptions, httpMaximumConnectionsPerHost});
    const toggleRetryPolicyType = (on) => setRetryPolicyOptions({...retryPolicyOptions, type: on ? EXPONENTIAL_RETRY : ''});
    const setRetryLimit = (retryLimit) => setRetryPolicyOptions({...retryPolicyOptions, retryLimit});
    const setExponentialBackoffBase = (exponentialBackoffBase) => setRetryPolicyOptions({...retryPolicyOptions, exponentialBackoffBase});
    const setExponentialBackoffScale = (exponentialBackoffScale) => setRetryPolicyOptions({...retryPolicyOptions, exponentialBackoffScale});

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


    const sanitizeHeaders = () => {
        const headers = {};
        clientHeaders.forEach(({key, value}) => {
           if (key && value) {
               headers[key] = value;
           } 
        });

        return headers;
    }

    const parseSessionOptions = () => ({
        ...sessionOptions,
        timeoutIntervalForRequest: Number(sessionOptions.timeoutIntervalForRequest),
        timeoutIntervalForResource: Number(sessionOptions.timeoutIntervalForResource),
        httpMaximumConnectionsPerHost: Number(sessionOptions.httpMaximumConnectionsPerHost),
    });

    const parseRetryPolicyOptions = () => {
        if (retryPolicyOptions.type !== EXPONENTIAL_RETRY) {
            return null;
        }

        return Object.keys(retryPolicyOptions).reduce((options, key) => {
            let value = Number(retryPolicyOptions[key]);
            if (value) {
                options[key] = value;
            }

            return options;
        }, {type: EXPONENTIAL_RETRY});
    };

    const createClient = async () => {
        const headers = sanitizeHeaders();
        const options = {
            headers,
            ...parseSessionOptions(),
        };
        const retryPolicyConfiguration = parseRetryPolicyOptions();
        if (retryPolicyConfiguration) {
            options.retryPolicyConfiguration = retryPolicyConfiguration;
        }

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
    );

    const renderRetryPolicyOptions = () => {
        const checked = retryPolicyOptions.type === EXPONENTIAL_RETRY;
        const checkbox = (
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Retries with exponential backoff?</Text>
                <CheckBox
                    value={checked}
                    onValueChange={toggleRetryPolicyType}
                />
            </View>
        );

        let options;
        if (checked) {
            options = (
                <>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Retry Limit</Text>
                        <View style={styles.numericInputContainer}>
                            <TextInput
                                value={retryPolicyOptions.retryLimit}
                                onChangeText={setRetryLimit}
                                placeholder='2'
                                style={styles.input}
                                keyboardType='numeric'
                            />
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Exponential backoff base</Text>
                        <View style={styles.numericInputContainer}>
                            <TextInput
                                value={retryPolicyOptions.exponentialBackoffBase}
                                onChangeText={setExponentialBackoffBase}
                                placeholder='2'
                                style={styles.input}
                                keyboardType='numeric'
                            />
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Exponential backoff scale</Text>
                        <View style={styles.numericInputContainer}>
                            <TextInput
                                value={retryPolicyOptions.exponentialBackoffScale}
                                onChangeText={setExponentialBackoffScale}
                                placeholder='0.5'
                                style={styles.input}
                                keyboardType='decimal-pad'
                            />
                        </View>
                    </View>
                </>
            );
        }

        return (
            <>
                {checkbox}
                {options}
            </>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder='Mattermost Community Server'
                            autoCapitalize='none'
                            style={styles.input}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Root URL</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput
                            value={baseUrl}
                            onChangeText={setbaseUrl}
                            placeholder='https://community.mattermost.com'
                            autoCapitalize='none'
                            style={styles.input}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Follow Redirects?</Text>
                    <CheckBox
                        value={sessionOptions.followRedirects}
                        onValueChange={setFollowRedirects}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Allow Cellular Access?</Text>
                    <CheckBox
                        value={sessionOptions.allowsCellularAccess}
                        onValueChange={setAllowsCellularAccess}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Waits For Connectivity?</Text>
                    <CheckBox
                        value={sessionOptions.waitsForConnectivity}
                        onValueChange={setWaitsForConnectivity}
                    />
                </View>

                {renderRetryPolicyOptions()}

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Timeout Interval For Request</Text>
                    <View style={styles.numericInputContainer}>
                        <TextInput
                            value={sessionOptions.timeoutIntervalForRequest}
                            onChangeText={setTimeoutIntervalForRequest}
                            placeholder='60'
                            style={styles.input}
                            keyboardType='numeric'
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Timeout Interval For Resource</Text>
                    <View style={styles.numericInputContainer}>
                        <TextInput
                            value={sessionOptions.timeoutIntervalForResource}
                            onChangeText={setTimeoutIntervalForResource}
                            placeholder='60'
                            style={styles.input}
                            keyboardType={'numeric'}
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Max Connections</Text>
                    <View style={styles.numericInputContainer}>
                        <TextInput
                            value={sessionOptions.httpMaximumConnectionsPerHost}
                            onChangeText={setHttpMaximumConnectionsPerHost}
                            placeholder='10'
                            style={styles.input}
                            keyboardType='numeric'
                        />
                    </View>
                </View>

                <View style={styles.headersLabelContainer}>
                    <Text style={styles.label}>Client Headers</Text>
                    <Button title='+' onPress={addClientHeader}/>
                </View>
                <View style={styles.headersContainer}>
                    {renderClientHeaders()}
                </View>
            </ScrollView>

            <Button
                title='Create'
                disabled={name.length === 0 || baseUrl.length === 0}
                onPress={createClient}
            />
        </SafeAreaView>
    );
}