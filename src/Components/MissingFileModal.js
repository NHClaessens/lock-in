import { Modal, ModalBody, ModalContent, ModalOverlay, Text, Center, Button, Flex } from "@chakra-ui/react";
import { useState } from "react";

export default function MissingFileModal({isOpen, onClose, onSubmit, toReplace, addSourceOption, removeSource}) {

    const [ newFiles, setNewFiles ] = useState({})

    let done = () => (Object.entries(newFiles).length === toReplace.length)

    console.log("replace", toReplace)
    console.log("new files", newFiles)

    return <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay/>
        <ModalContent>
            <ModalBody display="flex" flexDir="column" gap="16px">
                <Text>The following files have not been found, please replace or remove them:</Text>
                <Flex gap="16px" flexDir="column">

                {toReplace.map((item, i) => {
                    return <Flex key={i} align="center" justify="space-between">
                        <Text>{item.source.name}</Text>

                        <Flex gap="8px">
                            <Button as="label" htmlFor={"upload" + i}>Upload file</Button>
                            <input id={"upload" + i} type="file" accept="audio/*" hidden onChange={(e) => {
                                let file = e.target.files[0]
                                let url = URL.createObjectURL(file)
                                console.log("FILE", url)
                                setNewFiles({...newFiles, [item.index]: url})
                                }}/>
                            <Button bg="red" onClick={() => {
                                removeSource(item.index)
                                setNewFiles({...newFiles, [item.index]: null})
                                
                            }}>Remove</Button>

                        </Flex>
                    </Flex>
                })}
                </Flex>
                <Center>
                <Button 
                    bg={done() ? "green" : "gray"} 
                    disabled={!done()} 
                    cursor={done() ? "pointer" : "default"}
                    _hover={done() ? {} : {bg: "gray"}}
                    onClick={() => {
                        if(!done()) return

                        toReplace.forEach(element => {
                            if(newFiles[element.index] !== null) {
                                console.log("not null", element.index)
                                addSourceOption({name: element.source.name, path: newFiles[element.index]}, element.index)
                            }
                        });

                        onSubmit()
                    }}
                >Done</Button>

                </Center>

            </ModalBody>
        </ModalContent>
    </Modal>
}