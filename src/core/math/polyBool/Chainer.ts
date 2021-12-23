/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */

import { Epsilon } from "./Epsilon";
import type { Path, Segment } from "./types";

interface Match {
	index: number;
	matches_head: boolean;
	matches_pt1: boolean;
}

export function segmentChainer(segments: Segment[]): Path[] {
	let chains: Path[] = [];
	let regions: Path[] = [];

	segments.forEach((seg) => {
		let pt1 = seg.start;
		let pt2 = seg.end;
		if(Epsilon.$pointsSame(pt1, pt2)) {
			console.warn('PolyBool: Warning: Zero-length segment detected; your epsilon is probably too small or too large');
			return;
		}

		// search for two chains that this segment matches
		let first_match: Match = {
			index: 0,
			matches_head: false,
			matches_pt1: false,
		};
		let second_match: Match = {
			index: 0,
			matches_head: false,
			matches_pt1: false,
		};
		let next_match: Match | null = first_match;

		function setMatch(index: number, matches_head: boolean, matches_pt1: boolean): boolean {
			// return true if we've matched twice
			next_match!.index = index;
			next_match!.matches_head = matches_head;
			next_match!.matches_pt1 = matches_pt1;
			if(next_match === first_match) {
				next_match = second_match;
				return false;
			}
			next_match = null;
			return true; // we've matched twice, we're done here
		}

		/**
		 * 這邊採用線性搜尋的方式檢查所有的 chain，這乍看非常沒效率，
		 * 但很意外地，實務上 chains 的大小頂多兩三個而已，所以不需要更進一步改進。
		 */
		for(let i = 0; i < chains.length; i++) {
			let chain = chains[i];
			let head = chain[0];
			//let head2 = chain[1];
			let tail = chain[chain.length - 1];
			//let tail2 = chain[chain.length - 2];
			if(Epsilon.$pointsSame(head, pt1)) {
				if(setMatch(i, true, true)) break;
			} else if(Epsilon.$pointsSame(head, pt2)) {
				if(setMatch(i, true, false)) break;
			} else if(Epsilon.$pointsSame(tail, pt1)) {
				if(setMatch(i, false, true)) break;
			} else if(Epsilon.$pointsSame(tail, pt2)) {
				if(setMatch(i, false, false)) break;
			}
		}

		if(next_match === first_match) {
			// we didn't match anything, so create a new chain
			chains.push([pt1, pt2]);
			return;
		}

		if(next_match === second_match) {
			// we matched a single chain

			// add the other point to the appropriate end, and check to see if we've closed the
			// chain into a loop

			let index = first_match.index;
			let pt = first_match.matches_pt1 ? pt2 : pt1; // if we matched pt1, then we add pt2, etc
			let addToHead = first_match.matches_head; // if we matched at head, then add to the head

			let chain = chains[index];
			let grow = addToHead ? chain[0] : chain[chain.length - 1];
			let grow2 = addToHead ? chain[1] : chain[chain.length - 2];
			let oppo = addToHead ? chain[chain.length - 1] : chain[0];
			let oppo2 = addToHead ? chain[chain.length - 2] : chain[1];

			if(Epsilon.$pointsCollinear(grow2, grow, pt)) {
				// grow isn't needed because it's directly between grow2 and pt:
				// grow2 ---grow---> pt
				if(addToHead) {
					chain.shift();
				} else {
					chain.pop();
				}
				grow = grow2; // old grow is gone... new grow is what grow2 was
			}

			if(Epsilon.$pointsSame(oppo, pt)) {
				// we're closing the loop, so remove chain from chains
				chains.splice(index, 1);

				if(Epsilon.$pointsCollinear(oppo2, oppo, grow)) {
					// oppo isn't needed because it's directly between oppo2 and grow:
					// oppo2 ---oppo--->grow
					if(addToHead) {
						chain.pop();
					} else {
						chain.shift();
					}
				}

				// we have a closed chain!
				regions.push(chain);
				return;
			}

			// not closing a loop, so just add it to the appropriate side
			if(addToHead) {
				chain.unshift(pt);
			} else {
				chain.push(pt);
			}
			return;
		}

		// otherwise, we matched two chains, so we need to combine those chains together

		function reverseChain(index: number): void {
			chains[index].reverse(); // gee, that's easy
		}

		function appendChain(index1: number, index2: number): void {
			// index1 gets index2 appended to it, and index2 is removed
			let chain1 = chains[index1];
			let chain2 = chains[index2];
			let tail = chain1[chain1.length - 1];
			let tail2 = chain1[chain1.length - 2];
			let head = chain2[0];
			let head2 = chain2[1];

			if(Epsilon.$pointsCollinear(tail2, tail, head)) {
				// tail isn't needed because it's directly between tail2 and head
				// tail2 ---tail---> head
				chain1.pop();
				tail = tail2; // old tail is gone... new tail is what tail2 was
			}

			if(Epsilon.$pointsCollinear(tail, head, head2)) {
				// head isn't needed because it's directly between tail and head2
				// tail ---head---> head2
				chain2.shift();
			}

			chains[index1] = chain1.concat(chain2);
			chains.splice(index2, 1);
		}

		let F = first_match.index;
		let S = second_match.index;

		let reverseF = chains[F].length < chains[S].length; // reverse the shorter chain, if needed
		if(first_match.matches_head) {
			if(second_match.matches_head) {
				if(reverseF) {
					// <<<< F <<<< --- >>>> S >>>>
					reverseChain(F);
					// >>>> F >>>> --- >>>> S >>>>
					appendChain(F, S);
				} else {
					// <<<< F <<<< --- >>>> S >>>>
					reverseChain(S);
					// <<<< F <<<< --- <<<< S <<<<   logically same as:
					// >>>> S >>>> --- >>>> F >>>>
					appendChain(S, F);
				}
			} else {
				// <<<< F <<<< --- <<<< S <<<<   logically same as:
				// >>>> S >>>> --- >>>> F >>>>
				appendChain(S, F);
			}
		} else if(second_match.matches_head) {
			// >>>> F >>>> --- >>>> S >>>>
			appendChain(F, S);
		} else if(reverseF) {
			// >>>> F >>>> --- <<<< S <<<<
			reverseChain(F);
			// <<<< F <<<< --- <<<< S <<<<   logically same as:
			// >>>> S >>>> --- >>>> F >>>>
			appendChain(S, F);
		} else {
			// >>>> F >>>> --- <<<< S <<<<
			reverseChain(S);
			// >>>> F >>>> --- >>>> S >>>>
			appendChain(F, S);
		}
	});

	return regions;
}
