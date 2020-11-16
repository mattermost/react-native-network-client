// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef} from 'react';
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

import MethodPicker, {METHOD} from '../components/MethodPicker';

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
    pickerContainer: {
        zIndex: Platform.OS === 'ios' ? 10 : 0,
    },
    inputLabel: {
        flex: 1,
    },
    input: {
        flex: 6,
        margin: 15,
        height: 40,
        padding: 5,
    },
    textInput: {
        borderWidth: 1,
        ...Platform.select({
            ios: { borderColor: PlatformColor('link') },
            android: {
                borderColor: PlatformColor('?attr/colorControlNormal')
            },
        }),
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
    },
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
                style={[styles.input, styles.textInput, {flex: 1}]}
            />
            <TextInput
                value={value}
                onChangeText={setValue}
                placeholder='value'
                autoCapitalize='none'
                onBlur={doUpdateHeader}
                style={[styles.input, styles.textInput, {flex: 1}]}
            />
        </>
    );

}

export default function GenericClientScreen({navigation, route}) {
    const {name, client} = route.params;

    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('http://google.com');//'https://jsonplaceholder.typicode.com/todos/1');
    const [body, setBody] = useState('');
    const [requestHeaders, setRequestHeaders] = useState([{key: '', value: ''}]);
    const [response, setResponse] = useState(null);
    const scrollView = useRef(null);

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
        const options = {
            headers: sanitizeHeaders(requestHeaders),
        };

        if (method !== METHOD.GET && body.length) {
            try {
                options.body = JSON.parse(body);
            } catch(e) {
                Alert.alert(
                    'Error parsing Body',
                    e.message,
                    [{text: 'OK'}],
                    {cancelable: false}
                );

                return;
            }
        }

        const requestMethod = client[method.toLowerCase()];
        if (typeof requestMethod === 'function') {
            try {
                const response = await requestMethod(url, options);
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

    const renderResponseHeader = ({item}) => (
        <View style={styles.responseHeader}>
            <Text>Key: {item[0]}</Text>
            <Text>Value: {item[1]}</Text>
            <View style={styles.responseTouchables}>
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
                        <Text style={styles.label}>Response: {response.code}</Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.inputContainer, styles.pickerContainer]}>
                <Text style={[styles.label, styles.inputLabel]}>Method</Text>
                <MethodPicker wrapperStyle={styles.input} onMethodPicked={setMethod} />
            </View>
            <View style={styles.inputContainer}>
                <Text style={[styles.label, styles.inputLabel]}>URL</Text>
                <TextInput
                    value={url}
                    onChangeText={setUrl}
                    placeholder='https://jsonplaceholder.typicode.com/todos/1'
                    autoCapitalize='none'
                    style={[styles.input, styles.textInput]}
                />
            </View>
            {method !== METHOD.GET &&
            <View style={styles.inputContainer}>
                <Text style={[styles.label, styles.inputLabel]}>Body</Text>
                <TextInput
                    value={body}
                    onChangeText={setBody}
                    placeholder='{"username": "johndoe"}'
                    autoCapitalize='none'
                    multiline={true}
                    style={[styles.input, styles.textInput]}
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
            <View style={styles.buttonContainer}>
                <Button
                    title='Make Request'
                    disabled={url.length === 0}
                    onPress={makeRequest}
                />
            </View>
        </SafeAreaView>
    );
}