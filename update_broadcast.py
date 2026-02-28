import re

with open('frontend/src/pages/Broadcast.jsx', 'r') as f:
    content = f.read()

# Add import for CoStreamingPanel
content = content.replace("import StreamHealthIndicator from '../components/StreamHealthIndicator';",
                          "import StreamHealthIndicator from '../components/StreamHealthIndicator';\nimport CoStreamingPanel from '../components/CoStreamingPanel';")

# Remove squad and inviteInput states
content = re.sub(r'  const \[squad, setSquad\] = useState\(\[\s*\{\s*id: 1, name: username, split: 100, isHost: true\s*\},?\s*\]\);\n', '', content)
content = re.sub(r"  const \[inviteInput, setInviteInput\] = useState\(''\);\n", '', content)

# Remove addSquadMember
content = re.sub(r'  const addSquadMember = \(\) => \{[\s\S]*?    \}\n  \};\n\n', '', content)

# Remove removeSquadMember
content = re.sub(r'  const removeSquadMember = \(id\) => \{[\s\S]*?     \}\n  \};\n\n', '', content)

# Remove useEffect for sync squad
content = re.sub(r'  // Sync initial squad when going live\n  useEffect\(\(\) => \{[\s\S]*?  \}, \[isLive, socket, username\]\); // Intentional omission of squad to only run on live state change\n\n', '', content)

# Replace the Co-Streaming section with the component
co_streaming_block = r'            \{\/\* Co-Streaming Section \*\/\}[\s\S]*?            <\/div>\n         <\/div>'

replacement = r'''            {/* Co-Streaming Section */}
            <CoStreamingPanel username={username} isLive={isLive} socket={socket} />
         </div>'''

content = re.sub(co_streaming_block, replacement, content)

with open('frontend/src/pages/Broadcast.jsx', 'w') as f:
    f.write(content)
