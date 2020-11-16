// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
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

import MethodPicker, {METHOD} from '../components/MethodPicker';

type NetworkClientScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NetworkClient'
>;

type NetworkClientScreenRouteProp = RouteProp< {params: {client: ApiClientInterface, name?: string} }, 'params'>;


type NetworkClientScreenProps = {
  navigation: NetworkClientScreenNavigationProp;
  route: NetworkClientScreenRouteProp
};

// type Client = {type: string, client: GenericClientInterface, name: string, baseUrl?: string, wsUrl?: string}


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
            // android: {
            //     borderColor: PlatformColor('?attr/colorControlNormal')
            // },
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
    },
});

type RequestHeaderProps = {index: number, header: {key: string, value: string}, updateHeader: (index: number, header: {key: string, value: string}) => void}
const RequestHeader = ({index, header, updateHeader}: RequestHeaderProps) => {
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

export default function NetworkClientScreen({route}: NetworkClientScreenProps) {
    const {client} = route.params;

    const [method, setMethod] = useState('GET');
    const [endpoint, setEndpoint] = useState('/api/v4/system/ping');
    const [body, setBody] = useState('');
    const [requestHeaders, setRequestHeaders] = useState([{key: '', value: ''}]);
    const [clientHeaders, setClientHeaders] = useState<Headers | null>(null);
    const [response, setResponse] = useState<Response | null>(null);
    const scrollView = useRef(null);

    const getClientHeaders = async () => {
        const headers = await client.getHeaders();
        setClientHeaders(headers);
    }

    useEffect(() => {        
        getClientHeaders();
    }, []);

    const sanitizeHeaders = (headersArray: {key: string, value: string}[]) => {
        const headers = headersArray
            .filter( (k,v) => k && v)
            .reduce( (prev, cur) => prev[cur.key] = cur.value , {} as any)
        return headers;
    }

    const makeRequest = async () => {
        const options: {headers: Headers, body?: Record<string, string>} = {
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

        // const requestMethod = client[method.toLowerCase()];
        const requestMethod = client.get
        if (typeof requestMethod === 'function') {
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
        // scrollView.current.scrollToEnd();
    }

    const updateRequestHeader = (index: number, header: {key: string, value: string}) => {
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

    const renderClientHeader = ({item}: {item: string[]}) => (
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

    const clientHeaderKey = (item: string[]) => `client-header-${item[0]}`;

    const addClientHeader = async ({key, value}: {key: string, value: string}) => {
        await client.addHeaders({[key]: value});
        getClientHeaders();
    };

    const renderResponseHeader = ({item}: {item: string[]}) => (
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
    const responseHeaderKey = (item: string[]) => `response-header-${item[0]}`;
    const renderSeparator = () => <View style={styles.separator} />

    const renderResponse = () => {
        if (response) {
            return (
                <>
                    <View style={styles.responseHeadersContainer}>
                        <Text style={styles.label}>Response</Text>
                        <Text style={styles.label}>Headers</Text>
                        <FlatList
                            data={Object.entries(response.headers!)}
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
            <Text style={styles.label}>Client Headers</Text>
            <View style={styles.clientHeadersContainer}>
                {renderClientInfo()}
            </View>
            <View style={[styles.inputContainer, styles.pickerContainer]}>
                <Text style={[styles.label, styles.inputLabel]}>Method</Text>
                <MethodPicker wrapperStyle={styles.input} onMethodPicked={setMethod} />
            </View>
            <View style={styles.inputContainer}>
                <Text style={[styles.label, styles.inputLabel]}>URL</Text>
                <TextInput
                    value={endpoint}
                    onChangeText={setEndpoint}
                    placeholder='/todos/1'
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
                <Button title='+' onPress={addRequestHeader as any}/>
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