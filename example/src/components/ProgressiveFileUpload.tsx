import React from "react";
import { Image, Text, View } from "react-native";
import { Bar as ProgressBar } from "react-native-progress";
import Icon from "react-native-vector-icons/Ionicons";

type ProgressiveFileUploadProps = {
    file?: File;
    progress: number;
};

const ProgressiveFileUpload = (props: ProgressiveFileUploadProps) => {
    const { file } = props;

    if (!Boolean(file)) {
        return null;
    }

    let FileComponent;
    if (file!.type?.startsWith("image")) {
        FileComponent = () => (
            <Image
                source={{ uri: file!.uri }}
                style={{
                    marginTop: 20,
                    width: 200,
                    height: 200,
                    alignSelf: "center",
                }}
                testID="progress_file_upload.file_component"
            />
        );
    } else {
        FileComponent = () => (
            <View
                style={{
                    borderWidth: 1,
                    width: 200,
                    height: 200,
                    alignSelf: "center",
                    justifyContent: "center",
                }}
                testID="progress_file_upload.file_component"
            >
                <Icon
                    name="document-text"
                    size={64}
                    style={{ alignSelf: "center" }}
                />
            </View>
        );
    }

    return (
        <>
            <FileComponent />
            <Text style={{ alignSelf: "center" }} testID="progress_file_upload.filename">{file!.name}</Text>
            <Text style={{ alignSelf: "center" }} testID="progress_file_upload.file_uri">{file!.uri}</Text>
            <ProgressBar
                progress={props.progress}
                width={200}
                style={{ alignSelf: "center" }}
                testID="progress_file_upload.progress_bar"
            />
        </>
    );
};

export default ProgressiveFileUpload;
