// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useRef} from 'react';
import {
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
import DeviceInfo from 'react-native-device-info';
import {getOrCreateApiClient} from '@mattermost/react-native-network-client';
import type { StackNavigationProp } from '@react-navigation/stack';

type CreateNetworkClientScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateNetworkClient'
>;

type CreateNetworkClientScreenProps = {
  navigation: CreateNetworkClientScreenNavigationProp;
//   route: CreateNetworkClientScreenRouteProp
};

// type Client = {type: string, client: GenericClientInterface, name: string, baseUrl?: string, wsUrl?: string}


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
            // android: {
            //     borderColor: PlatformColor('?attr/colorControlNormal')
            // },
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


type ConfigOptionProps = {index: number, option: {key: string, value: string}, updateOption: (index: number, option: {key: string, value:string}) => void}
const ConfigOption = ({index, option, updateOption}: ConfigOptionProps) => {
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

export default function CreateNetworkClientScreen({navigation}: CreateNetworkClientScreenProps) {
    const [name, setName] = useState('Mattermost Community Server');
    const [baseUrl, setbaseUrl] = useState('https://community.mattermost.com');
    const [configOptions, setConfigOptions] = useState([{key: '', value: ''}]);
    const scrollView = useRef(null);

    const sanitizeOptions = async () => {
        // const options = {};
        // configOptions.forEach(({key, value}) => {
        //    if (key && value) {
        //        options[key] = value;
        //    } 
        // });

        // TEST MM OPTIONS
        const userAgent = await DeviceInfo.getUserAgent();
        const options = {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': userAgent,
            },

        }

        return options;
    }

    const createClient = async () => {
        const options = await sanitizeOptions();
        const client = await getOrCreateApiClient(baseUrl, options);
        const createdClient = {
            name,
            client,
            type: 'network',
        };

        navigation.navigate('ClientList', {client: createdClient});
    }

    const addConfigOption = () => {
        setConfigOptions([...configOptions, {key: '', value: ''}]);
        // scrollView.current.scrollToEnd();
    }

    const updateConfigOption = (index: number, option: {key: string, value: string}) => {
        const newConfigOptions = configOptions;
        newConfigOptions[index] = option;
        setConfigOptions(newConfigOptions);
    };

    const renderConfigOptions = () => (
        <ScrollView ref={scrollView}>
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
            <View style={styles.optionsLabelContainer}>
                <Text style={styles.label}>Configuration Options</Text>
                <Button title='+' onPress={addConfigOption}/>
            </View>
            <View style={styles.optionsContainer}>
                {renderConfigOptions()}
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