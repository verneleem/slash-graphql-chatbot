import { gql, GraphQLClient } from 'graphql-request';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { IBlock } from '.';
import SlashbotContext from './context';
import { useMountSetter } from './useMount';
// import useToggle from './useToggle';

const GET_ROOT = gql`
  query GET_ROOT {
    queryBlock(filter: { isRoot: true }) {
      id
      isRoot
      isSearchable
      format
      delay
      trigger
      content
      next {
        id
      }
      author {
        username
        displayName
        picture
      }
    }
  }
`;

const GET_BLOCKS = gql`
  query GET_BLOCKS($ids: [ID!]) {
    queryBlock(filter: { id: $ids }) {
      id
      isRoot
      isSearchable
      format
      delay
      trigger
      content
      next {
        id
      }
      author {
        username
        displayName
        picture
      }
    }
  }
`;

const BLOCK_LIST = gql`
  query BLOCK_LIST {
    queryBlock {
      id
      content
    }
  }
`;

const UPDATE_BLOCK = gql`
  mutation UPDATE_BLOCK($id: ID!, $update: BlockPatch) {
    updateBlock(input: { filter: { id: [$id] }, set: $update }) {
      numUids
    }
  }
`;

const REMOVE_CHILD = gql`
  mutation REMOVE_CHILD($parent: ID!, $id: ID!) {
    updateBlock(
      input: { filter: { id: [$parent] }, remove: { next: [{ id: $id }] } }
    ) {
      block {
        id
        next {
          id
        }
      }
    }
  }
`;

const ADD_EXISTING_CHILD = gql`
  mutation ADD_NEW_CHILD($parent: ID!, $child: ID!) {
    updateBlock(
      input: { filter: { id: [$parent] }, set: { next: [{ id: $child }] } }
    ) {
      block {
        id
        next {
          id
          id
          isRoot
          isSearchable
          format
          delay
          trigger
          content
          next {
            id
          }
          author {
            username
            displayName
            picture
          }
        }
      }
    }
  }
`;

const ADD_NEW_CHILD = gql`
  mutation ADD_NEW_CHILD($parent: ID!) {
    updateBlock(
      input: { filter: { id: [$parent] }, set: { next: [{ format: Text }] } }
    ) {
      block {
        id
        next {
          id
          id
          isRoot
          isSearchable
          format
          delay
          trigger
          content
          next {
            id
          }
          author {
            username
            displayName
            picture
          }
        }
      }
    }
  }
`;

const Blocks: React.FC<{ ids: string[]; parentID: string }> = ({
  ids,
  parentID,
}) => {
  const { client } = useContext(SlashbotContext);
  const [blocks, setBlocks] = useState<IBlock[]>([]);
  useEffect(() => {
    if (ids.length) {
      client
        ?.request<{ queryBlock: IBlock[] }, { ids: string[] }>(GET_BLOCKS, {
          ids,
        })
        .then((data) => setBlocks(data.queryBlock));
    } else {
      setBlocks([]);
    }
  }, [client, ids]);

  return (
    <div style={{ display: 'flex' }}>
      {Boolean(blocks.length) &&
        blocks.map((block, i) => (
          <Block
            key={i}
            {...block}
            parentID={parentID}
            setParentBlocks={setBlocks}
          />
        ))}
      <div
        style={{
          maxWidth: '100px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          textAlign: 'center',
          padding: '5px',
        }}
      >
        <button
          style={{ height: '80px' }}
          onClick={() =>
            setBlocks((blocks) => {
              const newBlocks = [...blocks];
              newBlocks.push({});
              return newBlocks;
            })
          }
        >
          Add New
        </button>
      </div>
    </div>
  );
};

interface BlockProps extends IBlock {
  parentID?: string;
  setParentBlocks?: React.Dispatch<React.SetStateAction<IBlock[]>>;
}

const Block: React.FC<BlockProps> = (props) => {
  const { parentID, setParentBlocks, ...block } = props;
  const { id, content, format, next, expand, isSearchable, delay } = block;
  const idRef = useRef(id);
  const [contentMutable, setContent] = useState(content);
  const [delayMutable, setDelay] = useState(delay);
  const [formatMutable, setFormat] = useState(format);
  const [isSearchableMutable, setIsSearchable] = useState(isSearchable);

  useEffect(() => {
    if (id !== idRef.current) {
      idRef.current = id;
      setContent(content);
      setDelay(delay);
      setFormat(format);
      setIsSearchable(isSearchable);
    }
  }, [content, delay, format, id, isSearchable]);

  // const [, toggle, isExpanded] = useToggle();
  const {
    parentBlockHistoryCount,
    previousParentBlock,
    setParentBlock,
    client,
  } = useContext(SlashbotContext);
  const ids = useMemo(
    () => next?.filter((b) => Boolean(b.id))?.map((b) => b.id as string) || [],
    [next],
  );
  const [allBlocks, setAllBlocks] = useState<IBlock[]>();

  useEffect(() => {
    if (!id) {
      client
        ?.request<{ queryBlock?: IBlock[] }, { ids: string[] }>(BLOCK_LIST)
        .then((data) => setAllBlocks(data?.queryBlock));
    }
  }, [client, id]);

  const [newID, setNewID] = useState<string>('');

  return (
    <>
      <div
        style={{
          minWidth: '100px',
          border: '1px solid black',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {!Boolean(id) && (
            <>
              <select value={newID} onChange={(e) => setNewID(e.target.value)}>
                <option>New</option>
                {allBlocks?.map((b) => (
                  <option key={b.id as string} value={b.id}>
                    {b?.content && b.content.length > 40
                      ? b.content.substr(0, 39) + '…'
                      : b.content}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (newID === '')
                    return client
                      ?.request(ADD_NEW_CHILD, { parent: parentID })
                      .then((data) => {
                        if (Array.isArray(data.updateBlock.block?.[0]?.next))
                          setParentBlocks?.(data.updateBlock.block[0].next);
                      });
                  return client
                    ?.request(ADD_EXISTING_CHILD, {
                      parent: parentID,
                      child: newID,
                    })
                    .then((data) => {
                      if (Array.isArray(data.updateBlock.block?.[0]?.next))
                        setParentBlocks?.(data.updateBlock.block[0].next);
                    });
                }}
              >
                Add
              </button>
            </>
          )}
          {Boolean(id) && <p>ID: {id}</p>}
          {expand && Boolean(parentBlockHistoryCount) && (
            <button onClick={() => previousParentBlock()}>▲ Previous ▲</button>
          )}
          {Boolean(id) && (
            <div>
              <button
                style={{ height: '100%', marginRight: '10px' }}
                onClick={() => {
                  const update: any = {
                    isSearchable: isSearchableMutable,
                    content: contentMutable,
                    delay: delayMutable,
                  };
                  if (formatMutable) update.format = formatMutable;
                  client?.request(UPDATE_BLOCK, {
                    id,
                    update,
                  });
                }}
              >
                Update
              </button>
              {!expand && (
                <button
                  style={{ height: '100%' }}
                  onClick={() =>
                    client?.request(REMOVE_CHILD, { parent: parentID, id })
                  }
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
        {Boolean(id) && (
          <>
            <label>
              <select
                value={formatMutable}
                onChange={(e) =>
                  setFormat(
                    e.target.value as 'Text' | 'Image' | 'Link' | 'LinkExt',
                  )
                }
                key={id}
              >
                <option value="">Select Type</option>
                <option value="Text">Text</option>
                <option value="Image">Image</option>
                <option value="Link">Link</option>
                <option value="LinkExt">External Link</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={isSearchableMutable}
                onChange={(e) => {
                  if (e.target.checked) return setIsSearchable(true);
                  return setIsSearchable(false);
                }}
                key={id}
              />
              Searchable?
            </label>
            <label>
              Delay:
              <input
                key={id}
                value={delayMutable || '0.0'}
                type="number"
                min={0}
                step={0.5}
                onChange={(e) => setDelay(parseFloat(e.target.value))}
                style={{ margin: '10px 5px 10px 5px' }}
              />
              seconds
            </label>
            <textarea
              key={id}
              value={contentMutable}
              onChange={(e) => setContent(e.target.value)}
              style={{ resize: 'vertical', margin: '10px 0 10px 0' }}
            />
            {!expand && (
              <button onClick={() => setParentBlock(block)}>▼ Next ▼</button>
            )}
            {expand && <Blocks ids={ids} parentID={id as string} />}
          </>
        )}
      </div>
    </>
  );
};

interface ITrain {}

const Train: React.FC<ITrain> = () => {
  const { toggleChatWidget, client, parentBlock, setParentBlock } = useContext(
    SlashbotContext,
  );
  useMountSetter(toggleChatWidget, false, true);

  useEffect(() => {
    if (client instanceof GraphQLClient)
      if (!parentBlock?.id)
        client.request<{ queryBlock?: IBlock[] }>(GET_ROOT).then((data) => {
          if (data.queryBlock?.length) {
            if (data.queryBlock.length === 1)
              return setParentBlock(data.queryBlock[0]);
            if (data.queryBlock.length > 1)
              throw new Error('Cannot have multiple root blocks');
            throw new Error('No Block Found');
          }
        });
  }, [client, parentBlock, setParentBlock]);
  return (
    <div style={{ textAlign: 'left' }}>
      <h2>Train Your Bot</h2>
      {Boolean(parentBlock?.id) && (
        <Block {...(parentBlock as IBlock)} expand />
      )}
    </div>
  );
};

export default Train;
