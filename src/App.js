import React from 'react';
import { Reorder } from 'framer-motion';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
	const PAGE_LIMIT = 2;
	const [items, dispatch] = React.useReducer(reducer, []);
	const [page, setPage] = React.useState(1);

	React.useEffect(() => {
		const fetchItems = async () => {
			let { data } = await supabase.from('items').select(`id, x, y`);
			dispatch({ type: 'reorder', items: data });
		};

		fetchItems();

		return () => {};
	}, []);

	function reducer(state, action) {
		switch (action.type) {
			case 'setXY':
				return [
					...state.map((item) =>
						item.id === action.id
							? { ...item, x: action.x, y: action.y }
							: item,
					),
				];
			case 'add':
				return [...state, { id: action.id, x: 0, y: 0 }];
			case 'remove':
				return [...state.filter((item) => item.id !== action.id)];
			case 'reorder':
				return [...action.items];
			default:
				return state;
		}
	}

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSave = React.useCallback(
		debounce((newOrder) => {
			dispatch({ type: 'reorder', items: newOrder });
		}, 500),
		[],
	);

	const updateReorder = (newOrder) => {
		debouncedSave([...newOrder, ...items.slice(2 * page)]);
	};

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSetValue = React.useCallback(
		debounce((item, x, y) => {
			supabase
				.from('items')
				.upsert({ id: item.id, x, y })
				.then((res) => console.log({ res }));
		}, 500),
		[],
	);

	const updateValue = (item, x, y) => {
		debouncedSetValue(item, x, y);
	};

	return (
		<div className='App'>
			<div className='grid'>
				<div>X</div>
				<div>Y</div>
				<div>X+Y</div>
				<div>X-Y</div>
				<div>X^Y</div>
				<div>
					<button
						className='outline'
						onClick={() => {
							supabase
								.from('items')
								.insert({ id: uuidv4(), x: 0, y: 0 })
								.then((response) => {
									dispatch({ type: 'add', id: response.data[0].id });
								});
						}}
					>
						+
					</button>
				</div>
			</div>
			<hr />
			<Reorder.Group axis='y' values={items} onReorder={updateReorder}>
				{items.slice(0, PAGE_LIMIT * page).map((item, index) => (
					<Reorder.Item key={index} value={item}>
						<div className='grid'>
							<div>
								<input
									value={item.x}
									onChange={(event) => {
										let value = +event.target.value;
										dispatch({
											type: 'setXY',
											id: item.id,
											x: value,
											y: item.y,
										});
										updateValue(item, value, item.y);
									}}
								/>
							</div>
							<div>
								<input
									value={item.y}
									onChange={(event) => {
										let value = +event.target.value;
										dispatch({
											type: 'setXY',
											id: item.id,
											x: item.x,
											y: value,
										});
										updateValue(item, item.x, value);
									}}
								/>
							</div>
							<div>{item.x + item.y}</div>
							<div>{item.x - item.y}</div>
							<div>{item.x ^ item.y}</div>
							<div>
								<button
									className='outline secondary'
									onClick={() => {
										dispatch({ type: 'remove', id: item.id });
										setPage(Math.ceil(items.length / PAGE_LIMIT));
									}}
								>
									-
								</button>
							</div>
						</div>
					</Reorder.Item>
				))}
			</Reorder.Group>
			{items.slice(0, PAGE_LIMIT * page).length < items.length && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<button
						className='outline'
						style={{
							width: '25%',
						}}
						onClick={() => setPage((page) => page + 1)}
					>
						Load more...
					</button>
				</div>
			)}
		</div>
	);
}

export default App;
