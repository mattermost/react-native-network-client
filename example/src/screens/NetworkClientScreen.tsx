// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef, useEffect} from 'react';
import {
    Alert,
    Button,
    FlatList,
    Platform,
    PlatformColor,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 15,
    },
    label: {
        padding: 5,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputLabel: {
        flex: 1,
    },
    input: {
        flex: 6,
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
    clientHeadersContainer: {
        flex: 1,
        paddingHorizontal: 15,
    },
    optionsLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionsContainer: {
        flex: 1,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    responseContainer: {
        flex: 3,
    },
    responseScrollView: {
        paddingHorizontal: 15,
    },
    responseHeadersContainer: {
        flex: 1,
    },
    responseDataContainer: {
        flex: 1,
    },
    responseHeader: {
        marginLeft: 10,
    },
    responseTouchables: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    separator: {
        height: 0.5,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    link: {
        ...Platform.select({
            ios: { color: PlatformColor('link') },
            android: {
                color: PlatformColor('?attr/colorControlNormal')
            },
        }),
    }
});

const RequestHeader = ({index, header, updateHeader}) => {
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


export default function GenericClientScreen({navigation, route}) {
    const {name, client} = route.params;

    const [method, setMethod] = useState('GET');
    const [endpoint, setEndpoint] = useState('/api/v4/system/ping');
    const [body, setBody] = useState('');
    const [requestHeaders, setRequestHeaders] = useState([{key: '', value: ''}]);
    const [clientHeaders, setClientHeaders] = useState(null);
    const [response, setResponse] = useState(null);
    const scrollView = useRef(null);

    const getClientHeaders = async () => {
        const headers = await client.getHeaders();
        setClientHeaders(headers);
    }

    useEffect(() => {        
        getClientHeaders();
    }, []);

    const sanitizeHeaders = (headersArray) => {
        const headers = {};
        headersArray.forEach(({key, value}) => {
           if (key && value) {
            headers[key] = value;
           } 
        });

        return headers;
    }

    const makeRequest = async () => {
        const options = sanitizeHeaders(requestHeaders);
        let requestMethod;
        switch (method.toLowerCase().trim()) {
            case 'get':
                requestMethod = client.get;
                break;
            case 'post':
                requestMethod = client.post;
                break;
            default:
                break;
        }

        if (requestMethod) {
            try {
                const response = await requestMethod(endpoint, options);
                setResponse(response);
            } catch (e) {
                Alert.alert(
                    'Error',
                    e.message,
                    [{text: 'OK'}],
                    {cancelable: false}
                );
            }
        } else {
            Alert.alert(
                'Error',
                'Invalid request method',
                [{text: 'OK'}],
                {cancelable: false}
            );
        }
    }

    const addRequestHeader = (header = {key: '', value: ''}) => {
        setRequestHeaders([...requestHeaders, header]);
        scrollView.current.scrollToEnd();
    }

    const updateRequestHeader = (index, header) => {
        const newRequestHeaders = requestHeaders;
        newRequestHeaders[index] = header;
        setRequestHeaders(newRequestHeaders);
    };

    const renderRequestHeaders = () => (
        <ScrollView ref={scrollView}>
            {
                requestHeaders.map((header, index) => (
                    <View key={`header-${index}`} style={styles.option}>
                        <RequestHeader index={index} header={header} updateHeader={updateRequestHeader} />
                    </View>
                ))
            }
        </ScrollView>
    );

    const renderClientHeader = ({item}) => (
        <View>
            <Text>Key: {item[0]}</Text>
            <Text>Value: {item[1]}</Text>
        </View>
    );

    const renderClientInfo = () => {
        if (clientHeaders) {
            return (
                <FlatList
                    data={Object.entries(clientHeaders)}
                    renderItem={renderClientHeader}
                    keyExtractor={clientHeaderKey}
                    ItemSeparatorComponent={renderSeparator}
                />
            )
        } else {
            return <Text>None</Text>
        }
    }

    const clientHeaderKey = (item) => `client-header-${item[0]}`;

    const addClientHeader = async ({key, value}) => {
        await client.addHeaders({[key]: value});
        getClientHeaders();
    };

    const renderResponseHeader = ({item}) => (
        <View style={styles.responseHeader}>
            <Text>Key: {item[0]}</Text>
            <Text>Value: {item[1]}</Text>
            <View style={styles.responseTouchables}>
                <TouchableOpacity onPress={() => addClientHeader({key: item[0], value: item[1]})}>
                    <Text style={styles.link}>Add to client headers</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addRequestHeader({key: item[0], value: item[1]})}>
                    <Text style={styles.link}>Add to request headers</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
    const responseHeaderKey = (item) => `response-header-${item[0]}`;
    const renderSeparator = () => <View style={styles.separator} />

    const renderResponse = () => {
        if (response) {
            return (
                <>
                    <View style={styles.responseHeadersContainer}>
                        <Text style={styles.label}>Response</Text>
                        <Text style={styles.label}>Headers</Text>
                        <FlatList
                            data={Object.entries(response.headers)}
                            renderItem={renderResponseHeader}
                            keyExtractor={responseHeaderKey}
                            ItemSeparatorComponent={renderSeparator}
                        />
                    </View>
                    <View style={styles.responseDataContainer}>
                        <Text style={styles.label}>Data</Text>
                        <ScrollView contentContainerStyle={styles.responseScrollView}>
                            <Text>{JSON.stringify(response.data)}</Text>
                        </ScrollView>
                    </View>
                </>
            )
        }

        return null;
    }

    const doSetMethod = (method) => setMethod(method.trim().toUpperCase());

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.label}>Cleint Headers</Text>
            <View style={styles.clientHeadersContainer}>
                {renderClientInfo()}
            </View>
            <View style={styles.inputContainer}>
                <Text style={[styles.label, styles.inputLabel]}>Method</Text>
                <TextInput
                    value={method}
                    onChangeText={doSetMethod}
                    placeholder='GET'
                    autoCapitalize='none'
                    style={styles.input}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={[styles.label, styles.inputLabel]}>URL</Text>
                <TextInput
                    value={endpoint}
                    onChangeText={setEndpoint}
                    placeholder='/todos/1'
                    autoCapitalize='none'
                    style={styles.input}
                />
            </View>
            {method === 'POST' &&
            <View style={styles.inputContainer}>
                <Text style={[styles.label, styles.inputLabel]}>Body</Text>
                <TextInput
                    value={body}
                    onChangeText={setBody}
                    placeholder='{"username": "johndoe"}'
                    autoCapitalize='none'
                    multiline={true}
                    style={styles.input}
                />
            </View>
            }
            <View style={styles.optionsLabelContainer}>
                <Text style={styles.label}>Request Headers</Text>
                <Button title='+' onPress={addRequestHeader}/>
            </View>
            <View style={styles.optionsContainer}>
                {renderRequestHeaders()}
            </View>
            <View style={styles.responseContainer}>
                {renderResponse()}
            </View>
            <Button
                title='Make Request'
                disabled={endpoint.length === 0}
                onPress={makeRequest}
            />
        </SafeAreaView>
    );
}