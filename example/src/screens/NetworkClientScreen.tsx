// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef} from 'react';
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
     optionsLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
     },
     optionsContainer: {
        flex: 8,
     },
     option: {
         flexDirection: 'row',
         justifyContent: 'space-evenly',
     }
});

const ConfigOption = ({index, option, updateOption}) => {
    const [key, setKey] = useState(option.key);
    const [value, setValue] = useState(option.value);

    const doUpdateOption = () => {
        updateOption(index, {key, value});
    }

    return (
        <>
            <TextInput
                value={key}
                onChangeText={setKey}
                placeholder='key'
                autoCapitalize='none'
                onBlur={doUpdateOption}
                style={[styles.input, {flex: 1}]}
            />
            <TextInput
                value={value}
                onChangeText={setValue}
                placeholder='value'
                autoCapitalize='none'
                onBlur={doUpdateOption}
                style={[styles.input, {flex: 1}]}
            />
        </>
    );

}


export default function GenericClientScreen({navigation, route}) {
    const {name, client} = route.params;

    const [method, setMethod] = useState('GET');
    const [endpoint, setEndpoint] = useState('/api/v4/system/ping');
    const [configOptions, setConfigOptions] = useState([{key: '', value: ''}]);
    const scrollView = useRef(null);

    const sanitizeOptions = () => {
        const options = {};
        configOptions.forEach(({key, value}) => {
           if (key && value) {
               options[key] = value;
           } 
        });

        return options;
    }

    makeRequest = async () => {
        const options = sanitizeOptions(configOptions);
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
                Alert.alert(
                    'Response',
                    JSON.stringify(response),
                    [{text: 'OK'}],
                    {cancelable: false}
                );
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

    const addConfigOption = () => {
        setConfigOptions([...configOptions, {key: '', value: ''}]);
        scrollView.current.scrollToEnd();
    }

    const updateConfigOption = (index, option) => {
        const newConfigOptions = configOptions;
        newConfigOptions[index] = option;
        setConfigOptions(newConfigOptions);
    };

    const renderConfigOptions = () => (
        <ScrollView ref={scrollView} contentContainerStyle={styles.scrollViewContainer}>
            {
                configOptions.map((option, index) => (
                    <View key={`option-${index}`} style={styles.option}>
                        <ConfigOption index={index} option={option} updateOption={updateConfigOption} />
                    </View>
                ))
            }
        </ScrollView>
    )

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.label}>Method</Text>
            <TextInput
                value={method}
                onChangeText={setMethod}
                placeholder='GET'
                autoCapitalize='none'
                style={styles.input}
            />
            <Text style={styles.label}>URL</Text>
            <TextInput
                value={endpoint}
                onChangeText={setEndpoint}
                placeholder='/todos/1'
                autoCapitalize='none'
                style={styles.input}
            />
            <View style={styles.optionsLabelContainer}>
                <Text style={styles.label}>Request Options</Text>
                <Button title='+' onPress={addConfigOption}/>
            </View>
            <View style={styles.optionsContainer}>
                {renderConfigOptions()}
            </View>
            <View style={styles.buttonContainer}>
                <Button
                    title='Make Request'
                    disabled={endpoint.length === 0}
                    onPress={makeRequest}
                />
            </View>
        </SafeAreaView>
    );
}