import { Request, Response } from "express";
import {
  createClient,
  getClients,
} from "../services/client.service.js";

export const create = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    const client = await createClient(name);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: client,
    });
  } catch (error) {
    console.error("CLIENT CREATE ERROR:", error);

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create client",
    });
  }
};

export const getAll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const clients = await getClients();

    res.status(200).json({
      success: true,
      message: "Clients retrieved successfully",
      data: clients,
    });
  } catch (error) {
    console.error("CLIENT GET ERROR:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load clients",
    });
  }
};