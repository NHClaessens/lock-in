import { Flex, Button, Card, Select, SimpleGrid, Text, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import MissingFileModal from "./MissingFileModal";

export default function AudioMixer() {

    const [audioContext ] = useState(new (window.AudioContext || window.webkitAudioContext)())

    const [ sources, setSources ] = useState([])
    const [ sourceOptions, setSourceOptions ] = useState([
        {
            name: "Mozart",
            path: "mozart.mp3"
        },
        {
            name: "Bible in Chinese",
            path: "bible.mp3"
        }
    ])
    const [ settings, setSettings ] = useState([])
    const defaultSettings = {
        volume: 1,
        speed: 1,
        stereo: 0,
        paused: true,
    }

    const [ players, setPlayers ] = useState([])

    // ask users to replace files that cannot be found
    const [ toReplace, setToReplace ] = useState([])
    async function checkBlobUrl(url) {
        try{
            return fetch(url)
            .then(response => {
                if (response.ok) {
                    return true;
                }
                throw new Error('Blob not found');
            })
            .catch(() => {
                return false;
            });
        } catch(error) {
            return false
        }
    }

    let modal = useDisclosure()

    function getReplacement(source, index) {
        setToReplace([...toReplace, {source: source, index: index}])
    }

    function createPlayer(source, setting) {
        const audioElement = new Audio(source.path)
        audioElement.loop = true
        const sourceNode = audioContext.createMediaElementSource(audioElement)
        const gainNode = audioContext.createGain()
        const pannerNode = audioContext.createStereoPanner()

        if(setting) {
            audioElement.playbackRate = setting.speed
            gainNode.gain.value = setting.volume
            pannerNode.pan.value = setting.stereo
        }

        sourceNode.connect(gainNode).connect(pannerNode).connect(audioContext.destination);

        return { audioElement, sourceNode, gainNode, pannerNode }
    }

    function addSource() {
        let player = createPlayer(sourceOptions[0], defaultSettings)
        setPlayers([...players, player])

        setSources([...sources, sourceOptions[0]])
        setSettings([...settings, defaultSettings])
    }

    const parseURL = () => {
        const queryParams = new URLSearchParams(window.location.search);
        const sources = queryParams.get("sources")
        const settings = queryParams.get("settings");
      
        let obj = {
            sources: [],
            settings: []
        }

        if(sources) {
            try {
                obj.sources = JSON.parse(decodeURIComponent(sources))
            } catch (error) {
                console.error("Couldn't decode sources", error)
            }
        }
        if(settings) {
            try {
                obj.settings = JSON.parse(decodeURIComponent(settings))
            } catch (error) {
                console.error("Couldn't decode settings", error)
            }
        }

        return obj
    };

    useEffect(() => {
        const url = parseURL();
        
        const yurr = async() => {
            const newPlayers = await url.sources.map( (source, index) => {
                return createPlayer(source, url.settings[index]);
            })
    
            setPlayers(newPlayers)
        }

        yurr()
        
        setSources(url.sources)
        setSettings(url.settings);


        url.sources.forEach((element, index) => {
            checkBlobUrl(element.path).then((res) => {
                if(!res)
                getReplacement(element, index)
            })
        });
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const updateURL = (sources, settings) => {
        if(sources.length === 0 || settings.length === 0 || sources.length !== settings.length) return;
        const queryParams = new URLSearchParams();
        queryParams.set("sources", encodeURIComponent(JSON.stringify(sources)));
        queryParams.set("settings", encodeURIComponent(JSON.stringify(settings)))
        window.history.pushState(null, null, "?" + queryParams.toString());
      };
    useEffect(() => updateURL(sources, settings), [sources, settings])

    function addSourceOption(newSource, playerIndex) {
        let newSourceOptions = [...sourceOptions, newSource]
        setSourceOptions(newSourceOptions)

        if(playerIndex !== undefined) {
            changePlayer(playerIndex, newSource)
        }
    }

    function changePlayer(index, source) {
        players[index].audioElement.src = source.path
        players[index].audioElement.load()

        let newSources = sources.map((item, i) => {
            if(i === index) return source
            else return item
        })
        setSources(newSources)

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, paused: true}
            else return item
        })
        setSettings(newSettings)
    }

    function removeSource(index) {
        setSources([...sources.slice(0, index), ...sources.slice(index + 1)])
        setPlayers([...players.slice(0, index), ...players.slice(index + 1)])
        setSettings([...settings.slice(0, index), ...settings.slice(index + 1)])
    }

    async function playAll() {
        if(audioContext.state !== "runing") {
            audioContext.resume()
        }
        players.forEach(player => {
            player.audioElement.play()
        });
        let newSettings = settings.map(item => {return {...item, paused: false}})
        setSettings(newSettings)
    }

    function pauseAll() {
        players.forEach(player => {
            player.audioElement.pause()
        });
        let newSettings = settings.map(item => {return {...item, paused: true}})
        setSettings(newSettings)
    }    


    function changeSpeed(index, speed) {
        players[index].audioElement.playbackRate = speed
        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, speed: speed}
            else return item
        })
        setSettings(newSettings)
    }

    function changeVolume(index, volume) {
        players[index].gainNode.gain.value = volume

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, volume: volume}
            else return item
        })
        setSettings(newSettings)
    }

    function changeStereo(index, stereo) {
        players[index].pannerNode.pan.value = stereo

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, stereo: stereo}
            else return item
        })
        setSettings(newSettings)
    }

    function toggle(index) {
        if(audioContext.state !== "runing") {
            audioContext.resume()
        }

        let player = players[index].audioElement
        if(player.paused) player.play()
        else player.pause()

        let newSettings = settings.map((item, i) => {
            if(i === index) return {...item, paused: player.paused}
            else return item
        })
        setSettings(newSettings)

        
    }

    return <>
    <MissingFileModal 
        isOpen={toReplace.length > 0} onClose={() => {modal.onClose()}} 
        toReplace={toReplace} addSourceOption={(source, index) => {console.addSourceOption(source, index)}} 
        removeSource={removeSource} onSubmit={() => {setToReplace([]); updateURL(sources, settings)}}
    />
    <Flex p="16px" flexDir="column" gap="16px">
        <Flex justify="center" gap="16px" ml="16px">
            <Button onClick={playAll}>Play all</Button>
            <Button onClick={pauseAll}>Pause all</Button>
        </Flex>
        <SimpleGrid minChildWidth="200px" gap="16px">
            {sources.map((item, index) => <Card key={index} p="16px" gap="8px">
                <Text>Source</Text>
                {players[index].audioElement.src}
                <Select value={sources[index].path} onChange={(e) => changePlayer(index, sourceOptions[e.target.selectedIndex])}>
                    {sourceOptions.map((item,index) => {
                    return <option value={item.path} key={index}>{item.name}</option>
                    })}
                </Select>
                <Text>Speed</Text>
                <Input type="number" value={settings[index]?.speed ?? 1} min={0.5} max={16} onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (val >= 0.0625 && val <= 16) {
                        changeSpeed(index, val)
                    }
                }}/>
                <Slider aria-label='slider-ex-1' value={settings[index]?.speed ?? 1} min={0.0625} max={16} step={0.1} onChange={(val) => {changeSpeed(index, val)}}>
                    <SliderTrack>
                    <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <Text>Stereo</Text>
                <Slider aria-label='slider-ex-1' defaultValue={0} min={-1} max={1} step={0.01} onChange={(val) => {changeStereo(index, val)}}>
                    <SliderTrack>
                    <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <Text>Volume</Text>
                <Input type="number" value={settings[index]?.volume ?? 1} min={0.5} max={16} onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (val >= 0) {
                        changeVolume(index, val)
                    }
                }}/>
                <Slider aria-label='slider-ex-1' value={settings[index]?.volume ?? 1} min={0} max={1} step={0.01} onChange={(val) => {changeVolume(index, val)}}>
                    <SliderTrack>
                    <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <Flex justify="center">
                    <Button onClick={() => toggle(index)}>{settings[index].paused ? "play" : "pause"}</Button>
                </Flex>
            </Card>)}
        </SimpleGrid>
        <Button onClick={() => addSource()}>Add source</Button>
        <Button as="label" htmlFor="upload">Upload file</Button>
        <input id="upload" type="file" accept="audio/*" hidden onChange={(e) => {
            let file = e.target.files[0]
            let url = URL.createObjectURL(file)
            setSourceOptions([...sourceOptions, {
                name: file.name,
                path: url
            }])
        }}/>
    </Flex></>
}